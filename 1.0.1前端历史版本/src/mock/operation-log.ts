/**
 * 操作日志 Mock（localStorage）
 * 依据：v3.1.6 §1.7.17；§3.4 页面 12（筛选 + 列表 + 详情；永久留存不可删）
 */

const STORAGE_KEY = 'jcyunpu_mock_operation_logs'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function readAll(): Api.OperationLog.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Api.OperationLog.Item[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Api.OperationLog.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId(list: Api.OperationLog.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 8000) + 1
}

/** 同步写入（供其它 Mock 调用）；不提供 update/delete */
export function appendOperationLog(input: {
  genealogyId?: number | null
  projectId?: number | null
  operatorUserId?: number | null
  operatorName?: string
  adminUserId?: number | null
  logCategory: Api.OperationLog.Category
  action: string
  targetType?: string
  targetId?: number | null
  changeSummary?: string
  changeDetail?: Record<string, { before?: unknown; after?: unknown }>
  ipAddress?: string
  userAgent?: string
}): Api.OperationLog.Item {
  const list = readAll()
  const item: Api.OperationLog.Item = {
    id: nextId(list),
    genealogyId: input.genealogyId ?? null,
    projectId: input.projectId ?? null,
    operatorUserId: input.operatorUserId ?? null,
    operatorName: input.operatorName,
    adminUserId: input.adminUserId ?? null,
    logCategory: input.logCategory,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    changeSummary: input.changeSummary,
    changeDetail: input.changeDetail,
    ipAddress: input.ipAddress || '127.0.0.1',
    userAgent: input.userAgent || navigator?.userAgent?.slice(0, 256),
    createdAt: nowIso()
  }
  writeAll([item, ...list])
  return item
}

function ensureSeed(genealogyId: number) {
  const list = readAll()
  if (list.some((l) => l.genealogyId === genealogyId)) return list

  let id = nextId(list)
  const seeds: Api.OperationLog.Item[] = [
    {
      id: id++,
      genealogyId,
      operatorUserId: 10001,
      operatorName: '云谱体验用户',
      logCategory: 'setting',
      action: 'genealogy.create',
      targetType: 'genealogy',
      targetId: genealogyId,
      changeSummary: '创建族谱',
      changeDetail: { name: { after: '示例族谱' } },
      ipAddress: '127.0.0.1',
      createdAt: daysAgoIso(5)
    },
    {
      id: id++,
      genealogyId,
      operatorUserId: 10001,
      operatorName: '云谱体验用户',
      logCategory: 'data',
      action: 'person.create',
      targetType: 'person',
      targetId: 2001,
      changeSummary: '新增人物「始祖」',
      changeDetail: {
        nameWei: { after: '始祖' },
        generation: { after: 1 }
      },
      ipAddress: '127.0.0.1',
      createdAt: daysAgoIso(4)
    },
    {
      id: id++,
      genealogyId,
      operatorUserId: 10001,
      operatorName: '云谱体验用户',
      logCategory: 'flow',
      action: 'project.advance',
      targetType: 'project',
      changeSummary: '推进至内容编排',
      changeDetail: { stage: { before: 1, after: 2 } },
      ipAddress: '127.0.0.1',
      createdAt: daysAgoIso(3)
    },
    {
      id: id++,
      genealogyId,
      operatorUserId: 10001,
      operatorName: '云谱体验用户',
      logCategory: 'collab',
      action: 'collaborator.invite',
      targetType: 'collaborator',
      changeSummary: '邀请采编（示例种子）',
      changeDetail: { phone: { after: '13900001111' } },
      ipAddress: '127.0.0.1',
      createdAt: daysAgoIso(2)
    },
    {
      id: id++,
      genealogyId,
      operatorUserId: 10001,
      operatorName: '云谱体验用户',
      logCategory: 'file',
      action: 'attachment.upload',
      targetType: 'attachment',
      changeSummary: '上传附件「老谱扫描件.pdf」',
      ipAddress: '127.0.0.1',
      createdAt: daysAgoIso(1)
    },
    {
      id: id++,
      genealogyId,
      operatorUserId: 10001,
      operatorName: '云谱体验用户',
      logCategory: 'ai',
      action: 'ocr.recognize',
      targetType: 'attachment',
      changeSummary: 'AI 老谱 OCR 识别（示例）',
      ipAddress: '127.0.0.1',
      createdAt: daysAgoIso(0)
    }
  ]
  const next = [...seeds, ...list]
  writeAll(next)
  return next
}

export async function mockListOperationLogs(
  params: Api.OperationLog.ListParams
): Promise<Api.Common.PaginatedResponse<Api.OperationLog.Item>> {
  await delay()
  const genealogyId = params.genealogyId
  let list = ensureSeed(genealogyId).filter((l) => l.genealogyId === genealogyId)

  if (params.logCategory) {
    list = list.filter((l) => l.logCategory === params.logCategory)
  }
  if (params.operatorUserId) {
    list = list.filter((l) => l.operatorUserId === Number(params.operatorUserId))
  }
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim().toLowerCase()
    list = list.filter(
      (l) =>
        (l.changeSummary || '').toLowerCase().includes(kw) ||
        l.action.toLowerCase().includes(kw) ||
        (l.operatorName || '').toLowerCase().includes(kw)
    )
  }
  if (params.startDate) {
    list = list.filter((l) => l.createdAt.slice(0, 10) >= params.startDate!)
  }
  if (params.endDate) {
    list = list.filter((l) => l.createdAt.slice(0, 10) <= params.endDate!)
  }

  list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const current = params.current || 1
  const size = params.size || 10
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    current,
    size,
    total: list.length
  }
}

export async function mockListOperationLogOperators(
  genealogyId: number
): Promise<Api.OperationLog.OperatorOption[]> {
  await delay(80)
  const list = ensureSeed(genealogyId).filter((l) => l.genealogyId === genealogyId)
  const map = new Map<number, string>()
  for (const item of list) {
    if (item.operatorUserId != null) {
      map.set(item.operatorUserId, item.operatorName || `用户${item.operatorUserId}`)
    }
  }
  return [...map.entries()].map(([userId, displayName]) => ({ userId, displayName }))
}

export async function mockGetOperationLog(
  genealogyId: number,
  id: number
): Promise<Api.OperationLog.Item> {
  await delay()
  const item = readAll().find((l) => l.id === id && l.genealogyId === genealogyId)
  if (!item) throw new Error('日志不存在')
  return item
}
