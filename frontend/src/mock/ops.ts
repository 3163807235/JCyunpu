/**
 * 运营后台 Mock（模块 N）
 * 依据：v3.1.6 §2.3 后台页面 01/02/04/06；禁止删除用户，仅冻结/解冻
 */

import { appendOperationLog } from './operation-log'
import { mockListOrders } from './subscription'

const USER_KEY = 'jcyunpu_mock_ops_users'
const AUDIT_KEY = 'jcyunpu_mock_ops_audit'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export type OpsAccountStatus = 'normal' | 'frozen'

export interface OpsUserItem {
  id: number
  nickName: string
  phone: string
  registeredAt: string
  planType: string
  planName: string
  expireAt?: string
  personUsed: number
  personLimit: number
  storageUsedMb: number
  storageLimitMb: number
  status: OpsAccountStatus
  freezeReason?: string
  remark?: string
}

export interface OpsAuditItem {
  id: number
  adminName: string
  action: string
  targetType: string
  targetId?: number
  summary: string
  detail?: Record<string, unknown>
  ipAddress: string
  createdAt: string
}

export interface OpsDashboardStats {
  userTotal: number
  activeGenealogyUsers: number
  genealogyTotal: number
  personTotal: number
  storageUsedMb: number
  orderMonthCount: number
  orderMonthAmount: number
  paidUserCount: number
  stageCounts: Record<number, number>
  expireSoonCount: number
  quotaExhaustedCount: number
}

function readUsers(): OpsUserItem[] {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as OpsUserItem[]) : []
  } catch {
    return []
  }
}

function writeUsers(list: OpsUserItem[]) {
  localStorage.setItem(USER_KEY, JSON.stringify(list))
}

function readAudits(): OpsAuditItem[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    return raw ? (JSON.parse(raw) as OpsAuditItem[]) : []
  } catch {
    return []
  }
}

function writeAudits(list: OpsAuditItem[]) {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(list))
}

function nextAuditId(list: OpsAuditItem[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 12000) + 1
}

function ensureSeedUsers() {
  let list = readUsers()
  if (list.length) return list
  const ts = nowIso()
  list = [
    {
      id: 10001,
      nickName: '云谱体验用户',
      phone: '13800138000',
      registeredAt: ts,
      planType: 'trial',
      planName: '试用',
      expireAt: undefined,
      personUsed: 0,
      personLimit: 50,
      storageUsedMb: 0,
      storageLimitMb: 100,
      status: 'normal'
    },
    {
      id: 10002,
      nickName: '陈氏修谱',
      phone: '13900001111',
      registeredAt: ts,
      planType: 'basic',
      planName: '基础年付',
      expireAt: '2027-03-01 00:00:00',
      personUsed: 120,
      personLimit: 500,
      storageUsedMb: 320,
      storageLimitMb: 2048,
      status: 'normal'
    },
    {
      id: 10003,
      nickName: '颍川谱局',
      phone: '13700002222',
      registeredAt: ts,
      planType: 'pro',
      planName: '专业年付',
      expireAt: '2026-09-20 00:00:00',
      personUsed: 800,
      personLimit: 2000,
      storageUsedMb: 1800,
      storageLimitMb: 10240,
      status: 'normal'
    },
    {
      id: 10004,
      nickName: '冻结示例',
      phone: '13600003333',
      registeredAt: ts,
      planType: 'basic',
      planName: '基础年付',
      expireAt: '2026-12-01 00:00:00',
      personUsed: 10,
      personLimit: 500,
      storageUsedMb: 20,
      storageLimitMb: 2048,
      status: 'frozen',
      freezeReason: '违规示例（Mock）'
    }
  ]
  writeUsers(list)
  return list
}

function appendAudit(
  input: Omit<OpsAuditItem, 'id' | 'createdAt' | 'ipAddress'> & { ipAddress?: string }
) {
  const list = readAudits()
  const item: OpsAuditItem = {
    id: nextAuditId(list),
    ipAddress: input.ipAddress || '127.0.0.1',
    createdAt: nowIso(),
    adminName: input.adminName,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary,
    detail: input.detail
  }
  writeAudits([item, ...list])
  appendOperationLog({
    genealogyId: null,
    adminUserId: 1,
    operatorName: input.adminName,
    logCategory: 'admin',
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    changeSummary: input.summary
  })
  return item
}

export async function mockOpsDashboard(): Promise<OpsDashboardStats> {
  await delay()
  const users = ensureSeedUsers()
  let genealogies: Api.Genealogy.Item[] = []
  let persons: Api.Person.Item[] = []
  let attachments: Api.Attachment.Item[] = []
  try {
    genealogies = JSON.parse(localStorage.getItem('jcyunpu_mock_genealogies') || '[]')
  } catch {
    genealogies = []
  }
  try {
    persons = JSON.parse(localStorage.getItem('jcyunpu_mock_persons') || '[]')
  } catch {
    persons = []
  }
  try {
    attachments = JSON.parse(localStorage.getItem('jcyunpu_mock_attachments') || '[]')
  } catch {
    attachments = []
  }

  const activeGenealogies = genealogies.filter((g) => !g.deletedAt)
  const stageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  activeGenealogies.forEach((g) => {
    const s = g.currentStage || 1
    stageCounts[s] = (stageCounts[s] || 0) + 1
  })

  const orders = await mockListOrders({ current: 1, size: 200 })
  const monthPrefix = nowIso().slice(0, 7)
  const monthOrders = orders.records.filter(
    (o) => o.paymentStatus === 1 && (o.paidAt || o.createdAt).startsWith(monthPrefix)
  )

  const now = Date.now()
  const soon = now + 7 * 24 * 3600 * 1000
  const expireSoonCount = users.filter((u) => {
    if (!u.expireAt || u.status === 'frozen') return false
    const t = new Date(u.expireAt.replace(' ', 'T')).getTime()
    return t >= now && t <= soon
  }).length

  return {
    userTotal: users.length,
    activeGenealogyUsers: new Set(activeGenealogies.map((g) => g.id)).size
      ? users.filter((u) => u.status === 'normal').length
      : users.length,
    genealogyTotal: activeGenealogies.length,
    personTotal: persons.filter((p) => !p.deletedAt).length,
    storageUsedMb: Number(
      (attachments.reduce((s, a) => s + (a.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)
    ),
    orderMonthCount: monthOrders.length,
    orderMonthAmount: monthOrders.reduce((s, o) => s + o.amount, 0),
    paidUserCount: users.filter((u) => u.planType !== 'trial').length,
    stageCounts,
    expireSoonCount,
    quotaExhaustedCount: users.filter((u) => u.personUsed >= u.personLimit).length
  }
}

export async function mockOpsUserList(params: {
  current?: number
  size?: number
  keyword?: string
  status?: OpsAccountStatus | ''
  planType?: string
}): Promise<Api.Common.PaginatedResponse<OpsUserItem>> {
  await delay()
  let list = [...ensureSeedUsers()]
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim()
    list = list.filter(
      (u) => u.nickName.includes(kw) || u.phone.includes(kw) || String(u.id).includes(kw)
    )
  }
  if (params.status) list = list.filter((u) => u.status === params.status)
  if (params.planType) list = list.filter((u) => u.planType === params.planType)
  list.sort((a, b) => (a.registeredAt < b.registeredAt ? 1 : -1))
  const current = params.current || 1
  const size = params.size || 10
  const start = (current - 1) * size
  return { records: list.slice(start, start + size), current, size, total: list.length }
}

export async function mockOpsFreezeUser(
  id: number,
  reason: string,
  adminName: string
): Promise<OpsUserItem> {
  await delay()
  const list = ensureSeedUsers()
  const idx = list.findIndex((u) => u.id === id)
  if (idx < 0) throw new Error('用户不存在')
  if (list[idx].status === 'frozen') throw new Error('用户已冻结')
  list[idx] = {
    ...list[idx],
    status: 'frozen',
    freezeReason: reason.trim() || '后台冻结'
  }
  writeUsers(list)
  appendAudit({
    adminName,
    action: 'user.freeze',
    targetType: 'user',
    targetId: id,
    summary: `冻结用户「${list[idx].nickName}」`,
    detail: { reason: list[idx].freezeReason }
  })
  return list[idx]
}

export async function mockOpsUnfreezeUser(id: number, adminName: string): Promise<OpsUserItem> {
  await delay()
  const list = ensureSeedUsers()
  const idx = list.findIndex((u) => u.id === id)
  if (idx < 0) throw new Error('用户不存在')
  if (list[idx].status !== 'frozen') throw new Error('用户未冻结')
  list[idx] = { ...list[idx], status: 'normal', freezeReason: undefined }
  writeUsers(list)
  appendAudit({
    adminName,
    action: 'user.unfreeze',
    targetType: 'user',
    targetId: id,
    summary: `解冻用户「${list[idx].nickName}」`
  })
  return list[idx]
}

export async function mockOpsOrderList(params: Api.Subscription.OrderListParams = {}) {
  await delay()
  const res = await mockListOrders(params)
  // 后台视图补充用户展示字段（Mock 绑定体验用户）
  return {
    ...res,
    records: res.records.map((o) => ({
      ...o,
      userNick: '云谱体验用户',
      userPhone: '13800138000'
    }))
  }
}

export async function mockOpsAuditList(params: {
  current?: number
  size?: number
  keyword?: string
  action?: string
}): Promise<Api.Common.PaginatedResponse<OpsAuditItem>> {
  await delay()
  let list = readAudits()
  if (!list.length) {
    appendAudit({
      adminName: '系统',
      action: 'ops.bootstrap',
      targetType: 'system',
      summary: '运营后台 Mock 审计日志已初始化'
    })
    list = readAudits()
  }
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim().toLowerCase()
    list = list.filter(
      (a) =>
        a.summary.toLowerCase().includes(kw) ||
        a.adminName.toLowerCase().includes(kw) ||
        a.action.toLowerCase().includes(kw)
    )
  }
  if (params.action) list = list.filter((a) => a.action === params.action)
  list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const current = params.current || 1
  const size = params.size || 10
  const start = (current - 1) * size
  return { records: list.slice(start, start + size), current, size, total: list.length }
}
