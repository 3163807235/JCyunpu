/**
 * 亲属关系 Mock
 */

const STORAGE_KEY = 'jcyunpu_mock_relations'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readAll(): Api.Relationship.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Api.Relationship.Item[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Api.Relationship.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId(list: Api.Relationship.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 3000) + 1
}

export const REL_TYPE_LABELS: Record<Api.Relationship.RelType, string> = {
  father: '生父',
  sifu: '嗣父',
  jiantiao: '兼祧父',
  jifu: '继父',
  yifu: '义父',
  mother: '生母',
  spouse: '配偶',
  zhuixu: '赘婿',
  chuji: '出继'
}

/** 父节点类关系（用于列表「父亲」列与更改父节点） */
export const FATHER_REL_TYPES: Api.Relationship.RelType[] = [
  'father',
  'sifu',
  'jiantiao',
  'jifu',
  'yifu'
]

/** 常规双向：配偶互存；父子不自动反写「子→父」类型，列表按 from/to 展示 */
export async function mockListRelations(
  genealogyId: number
): Promise<Api.Relationship.Item[]> {
  await delay()
  return readAll()
    .filter((r) => r.genealogyId === genealogyId && !r.deletedAt)
    .sort((a, b) => b.id - a.id)
}

export async function mockCreateRelation(
  params: Api.Relationship.CreateParams
): Promise<Api.Relationship.Item[]> {
  await delay()
  if (params.fromPersonId === params.toPersonId) {
    throw new Error('不能与自己建立关系')
  }
  const list = readAll()
  const exists = list.some(
    (r) =>
      !r.deletedAt &&
      r.genealogyId === params.genealogyId &&
      r.fromPersonId === params.fromPersonId &&
      r.toPersonId === params.toPersonId &&
      r.relType === params.relType
  )
  if (exists) throw new Error('该关系已存在')

  const created: Api.Relationship.Item[] = []
  const base: Api.Relationship.Item = {
    id: nextId(list),
    genealogyId: params.genealogyId,
    fromPersonId: params.fromPersonId,
    toPersonId: params.toPersonId,
    relType: params.relType,
    remark: params.remark || '',
    createdAt: nowIso(),
    deletedAt: null
  }
  list.push(base)
  created.push(base)

  // 配偶/赘婿自动双向（反向边备注与正向一致，禁止追加「（双向）」以免污染姓/名回填）
  if (params.relType === 'spouse' || params.relType === 'zhuixu') {
    const reverse: Api.Relationship.Item = {
      ...base,
      id: nextId(list),
      fromPersonId: params.toPersonId,
      toPersonId: params.fromPersonId,
      remark: params.remark || ''
    }
    list.push(reverse)
    created.push(reverse)
  }

  writeAll(list)
  const { notifyLiveDataEdit } = await import('./person')
  notifyLiveDataEdit(params.genealogyId, [params.fromPersonId, params.toPersonId])
  return created
}

export async function mockDeleteRelation(id: number): Promise<void> {
  await delay()
  const list = readAll()
  const idx = list.findIndex((r) => r.id === id && !r.deletedAt)
  if (idx < 0) throw new Error('关系不存在')
  const row = list[idx]
  list[idx] = { ...row, deletedAt: nowIso() }
  writeAll(list)
  const { notifyLiveDataEdit } = await import('./person')
  notifyLiveDataEdit(row.genealogyId, [row.fromPersonId, row.toPersonId])
}

export function readRelationsSync(genealogyId: number): Api.Relationship.Item[] {
  return readAll().filter((r) => r.genealogyId === genealogyId && !r.deletedAt)
}

/**
 * 更改生父：替换该人物现有 father 关系（§3.4 关系图谱 · 生父）
 * 嗣父/兼祧等其它父关系保留
 */
export async function mockSetFather(
  genealogyId: number,
  childId: number,
  fatherId: number,
  remark?: string
): Promise<Api.Relationship.Item> {
  await delay()
  if (childId === fatherId) throw new Error('不能将自己设为父亲')
  const list = readAll()
  const now = nowIso()
  list.forEach((r, i) => {
    if (
      !r.deletedAt &&
      r.genealogyId === genealogyId &&
      r.fromPersonId === childId &&
      r.relType === 'father'
    ) {
      list[i] = { ...r, deletedAt: now }
    }
  })
  writeAll(list)
  const created = await mockCreateRelation({
    genealogyId,
    fromPersonId: childId,
    toPersonId: fatherId,
    relType: 'father',
    remark: remark || '更改父节点'
  })
  return created[0]
}
