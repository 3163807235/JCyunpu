/**
 * 人物 Mock（localStorage）
 * 额度：回收站内人物仍占用额度，彻底删除或期满才释放（文档 §0.4 / 额度规则）
 */

import {
  appendPersonPurgeTransaction,
  assertPersonQuotaAvailable,
  assertSubscriptionWritable,
  getSubscriptionSummarySync
} from './subscription'
import { readRelationsSync } from './relationship'
import { filterPersonsByLineageScope } from '@/utils/genealogy/person-lineage'

const STORAGE_KEY = 'jcyunpu_mock_persons'
const GEN_KEY = 'jcyunpu_mock_generation'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readAll(): Api.Person.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Api.Person.Item[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Api.Person.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId(list: Api.Person.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 2000) + 1
}

function isTrash(item: Api.Person.Item) {
  return !!item.deletedAt
}

/** 占用额度人数（含回收站） */
export function countPersonQuotaUsed(genealogyId?: number): number {
  return readAll().filter((p) => {
    if (genealogyId != null && p.genealogyId !== genealogyId) return false
    return true // 含回收站
  }).length
}

export function countActivePersons(genealogyId: number): number {
  return readAll().filter((p) => p.genealogyId === genealogyId && !isTrash(p)).length
}

function syncGenealogyPersonCount(genealogyId: number) {
  try {
    const raw = localStorage.getItem('jcyunpu_mock_genealogies')
    if (!raw) return
    const list = JSON.parse(raw) as Api.Genealogy.Item[]
    const idx = list.findIndex((g) => g.id === genealogyId)
    if (idx < 0) return
    list[idx] = {
      ...list[idx],
      personCount: countActivePersons(genealogyId),
      updatedAt: nowIso()
    }
    localStorage.setItem('jcyunpu_mock_genealogies', JSON.stringify(list))
  } catch {
    // ignore
  }
}

function readGenealogyStage(genealogyId: number): Api.Genealogy.Stage | null {
  try {
    const raw = localStorage.getItem('jcyunpu_mock_genealogies')
    if (!raw) return null
    const list = JSON.parse(raw) as Api.Genealogy.Item[]
    return list.find((x) => x.id === genealogyId)?.currentStage ?? null
  } catch {
    return null
  }
}

/** 校对/排版期改人：重置已通过；排版期置 layoutDirty */
export function notifyLiveDataEdit(genealogyId: number, personIds: number[]) {
  const stage = readGenealogyStage(genealogyId)
  if (stage !== 3 && stage !== 4) return
  const list = readAll()
  let changed = false
  for (const id of personIds) {
    const idx = list.findIndex((p) => p.id === id)
    if (idx < 0) continue
    if (list[idx].reviewStatus === 1) {
      list[idx] = { ...list[idx], reviewStatus: 0, updatedAt: nowIso() }
      changed = true
    }
  }
  if (changed) writeAll(list)
  if (stage === 4) {
    try {
      const raw = localStorage.getItem('jcyunpu_mock_genealogies')
      if (!raw) return
      const glist = JSON.parse(raw) as Api.Genealogy.Item[]
      const gidx = glist.findIndex((g) => g.id === genealogyId)
      if (gidx < 0) return
      glist[gidx] = { ...glist[gidx], layoutDirty: 1, updatedAt: nowIso() }
      localStorage.setItem('jcyunpu_mock_genealogies', JSON.stringify(glist))
    } catch {
      // ignore
    }
  }
}

function applyLiveDataEditRules(genealogyId: number, personIds: number[]) {
  notifyLiveDataEdit(genealogyId, personIds)
}

/** 简易模式推进排版：全员视为校对通过 */
export function markAllPersonsReviewed(genealogyId: number) {
  const list = readAll()
  let changed = false
  const next = list.map((p) => {
    if (p.genealogyId !== genealogyId || isTrash(p) || p.reviewStatus === 1) return p
    changed = true
    return { ...p, reviewStatus: 1 as const, updatedAt: nowIso() }
  })
  if (changed) writeAll(next)
}

export function resetPersonsReviewStatus(genealogyId: number, personIds?: number[]) {
  const list = readAll()
  let changed = false
  const next = list.map((p) => {
    if (p.genealogyId !== genealogyId || isTrash(p)) return p
    if (personIds && !personIds.includes(p.id)) return p
    if (p.reviewStatus !== 1) return p
    changed = true
    return { ...p, reviewStatus: 0 as const, updatedAt: nowIso() }
  })
  if (changed) writeAll(next)
}

export function hasBlockingReviewStatus(genealogyId: number): boolean {
  return readAll().some(
    (p) =>
      p.genealogyId === genealogyId && !isTrash(p) && (p.reviewStatus === 0 || p.reviewStatus === 3)
  )
}

export async function mockListPersons(
  params: Api.Person.ListParams
): Promise<Api.Common.PaginatedResponse<Api.Person.Item>> {
  await delay()
  const current = params.current || 1
  const size = params.size || 10
  const scope = params.scope || 'active'
  let list = readAll().filter((p) => p.genealogyId === params.genealogyId)
  list = list.filter((p) => (scope === 'trash' ? isTrash(p) : !isTrash(p)))

  if (params.keyword) {
    const kw = params.keyword.trim()
    list = list.filter(
      (p) =>
        p.nameWei.includes(kw) ||
        (p.nameZi || '').includes(kw) ||
        (p.zibei || '').includes(kw) ||
        p.personNo.includes(kw)
    )
  }
  if (params.generation != null) {
    list = list.filter((p) => p.generation === params.generation)
  }
  if (params.gender != null) {
    list = list.filter((p) => p.gender === params.gender)
  }
  if (params.isAlive != null) {
    list = list.filter((p) => p.isAlive === params.isAlive)
  }

  // 默认仅本族主系；姻亲（嫁入挂名）可切「全部 / 仅姻亲」
  const lineageScope = params.lineageScope || 'lineage'
  if (lineageScope !== 'all') {
    const rels = readRelationsSync(params.genealogyId)
    list = filterPersonsByLineageScope(list, rels, lineageScope)
  }

  list = [...list].sort((a, b) => a.generation - b.generation || a.id - b.id)
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    current,
    size,
    total: list.length
  }
}

export async function mockGetPerson(id: number): Promise<Api.Person.Item> {
  await delay()
  const item = readAll().find((p) => p.id === id)
  if (!item || isTrash(item)) throw new Error('人物不存在')
  return item
}

export async function mockCreatePerson(
  genealogyId: number,
  params: Api.Person.FormParams,
  personLimit?: number
): Promise<Api.Person.Item> {
  await delay()
  assertSubscriptionWritable('新增人物')
  const limit = personLimit ?? getSubscriptionSummarySync().personLimit
  assertPersonQuotaAvailable(1)
  if (!params.nameWei?.trim()) throw new Error('请填写讳（本名）')
  if (countPersonQuotaUsed() >= limit) {
    throw new Error('人物额度已用尽，请扩容或清理回收站后再新增')
  }

  const list = readAll()
  const requestedNo = params.personNo?.trim()
  if (requestedNo) {
    const dup = list.some(
      (p) => p.genealogyId === genealogyId && !isTrash(p) && p.personNo === requestedNo
    )
    if (dup) throw new Error(`人物编号「${requestedNo}」已存在`)
  }
  const createdAt = nowIso()
  const item: Api.Person.Item = {
    id: nextId(list),
    genealogyId,
    personNo: requestedNo || `P${Date.now().toString().slice(-8)}`,
    generation: params.generation || 1,
    nameWei: params.nameWei.trim(),
    nameZi: params.nameZi?.trim() || '',
    nameHao: params.nameHao?.trim() || '',
    xingdi: params.xingdi?.trim() || '',
    zibei: params.zibei?.trim() || '',
    gender: params.gender,
    birthDate: params.birthDate || '',
    deathDate: params.deathDate || '',
    isAlive: params.isYoushang ? 0 : params.isAlive,
    isYoushang: !!params.isYoushang,
    nativePlace: params.nativePlace || '',
    burialPlace: params.burialPlace || '',
    biography: params.biography || '',
    privacyLevel: params.privacyLevel ?? 2,
    reviewStatus: params.zibeiDoubt ? 2 : 0,
    reviewNote: params.zibeiDoubt ? '字辈与派语不匹配，存疑' : '',
    zibeiDoubt: !!params.zibeiDoubt,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null
  }
  list.push(item)
  writeAll(list)
  syncGenealogyPersonCount(genealogyId)
  applyLiveDataEditRules(genealogyId, [item.id])
  return item
}

export async function mockUpdatePerson(
  id: number,
  params: Partial<Api.Person.FormParams>
): Promise<Api.Person.Item> {
  await delay()
  assertSubscriptionWritable('编辑人物')
  const list = readAll()
  const idx = list.findIndex((p) => p.id === id && !isTrash(p))
  if (idx < 0) throw new Error('人物不存在')
  const prev = list[idx]
  const next: Api.Person.Item = {
    ...prev,
    ...params,
    nameWei: params.nameWei?.trim() ?? prev.nameWei,
    nameZi: params.nameZi !== undefined ? params.nameZi.trim() : prev.nameZi,
    nameHao: params.nameHao !== undefined ? params.nameHao.trim() : prev.nameHao,
    isYoushang: params.isYoushang !== undefined ? !!params.isYoushang : !!prev.isYoushang,
    updatedAt: nowIso()
  }
  if (next.isYoushang) next.isAlive = 0
  if (params.zibeiDoubt) {
    next.reviewStatus = 2
    next.reviewNote = next.reviewNote || '字辈与派语不匹配，存疑'
  }
  list[idx] = next
  writeAll(list)
  applyLiveDataEditRules(prev.genealogyId, [id])
  return next
}

export async function mockSoftDeletePerson(id: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('删除人物')
  const list = readAll()
  const idx = list.findIndex((p) => p.id === id && !isTrash(p))
  if (idx < 0) throw new Error('人物不存在')
  const genealogyId = list[idx].genealogyId
  list[idx] = { ...list[idx], deletedAt: nowIso(), updatedAt: nowIso() }
  writeAll(list)
  syncGenealogyPersonCount(genealogyId)
  applyLiveDataEditRules(genealogyId, [id])
}

export async function mockRestorePerson(
  id: number,
  _personLimit?: number
): Promise<Api.Person.Item> {
  void _personLimit
  await delay()
  assertSubscriptionWritable('恢复人物')
  const list = readAll()
  const idx = list.findIndex((p) => p.id === id && isTrash(p))
  if (idx < 0) throw new Error('回收站中未找到该人物')
  // 回收站仍占用额度，恢复不额外占额（§0.4）
  list[idx] = { ...list[idx], deletedAt: null, updatedAt: nowIso() }
  writeAll(list)
  syncGenealogyPersonCount(list[idx].genealogyId)
  return list[idx]
}

export async function mockPurgePerson(id: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('彻底删除人物')
  const list = readAll()
  const target = list.find((p) => p.id === id)
  if (!target) throw new Error('人物不存在')
  const genealogyId = target.genealogyId
  writeAll(list.filter((p) => p.id !== id))
  // 同步删除关系
  try {
    const relRaw = localStorage.getItem('jcyunpu_mock_relations')
    if (relRaw) {
      const rels = JSON.parse(relRaw) as Api.Relationship.Item[]
      localStorage.setItem(
        'jcyunpu_mock_relations',
        JSON.stringify(rels.filter((r) => r.fromPersonId !== id && r.toPersonId !== id))
      )
    }
  } catch {
    // ignore
  }
  syncGenealogyPersonCount(genealogyId)
  appendPersonPurgeTransaction(1, `彻底删除人物「${target.nameWei}」，释放额度`)
}

export async function mockImportPersons(
  genealogyId: number,
  rows: Api.Person.ImportRow[] | Api.Person.FormParams[],
  personLimit = 50
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []
  const noToId = new Map<string, number>()

  const normalized: Api.Person.ImportRow[] = rows.map((r) => {
    if ('form' in r && r.form) return r as Api.Person.ImportRow
    const form = r as Api.Person.FormParams
    return {
      personNo: form.personNo?.trim() || '',
      form,
      spouseNos: []
    }
  })

  for (const row of normalized) {
    try {
      const form: Api.Person.FormParams = {
        ...row.form,
        personNo: row.personNo || row.form.personNo
      }
      const created = await mockCreatePerson(genealogyId, form, personLimit)
      if (row.personNo) noToId.set(row.personNo, created.id)
      success++
    } catch (e: any) {
      failed++
      errors.push(`${row.form.nameWei || row.personNo || '未命名'}：${e?.message || '失败'}`)
    }
  }

  // 第二遍：按编号挂生父/生母/配偶（§1.10.1 N/O/P）
  const { mockCreateRelation } = await import('./relationship')
  const spousePairs = new Set<string>()
  for (const row of normalized) {
    const childId = row.personNo ? noToId.get(row.personNo) : undefined
    if (!childId) continue
    try {
      if (row.fatherNo) {
        const fatherId = noToId.get(row.fatherNo)
        if (fatherId) {
          await mockCreateRelation({
            genealogyId,
            fromPersonId: childId,
            toPersonId: fatherId,
            relType: 'father',
            remark: '批量导入'
          })
        }
      }
      if (row.motherNo) {
        const motherId = noToId.get(row.motherNo)
        if (motherId) {
          await mockCreateRelation({
            genealogyId,
            fromPersonId: childId,
            toPersonId: motherId,
            relType: 'mother',
            remark: '批量导入'
          })
        }
      }
      for (const sn of row.spouseNos || []) {
        const spouseId = noToId.get(sn)
        if (!spouseId) continue
        const pairKey = [childId, spouseId].sort((a, b) => a - b).join('-')
        if (spousePairs.has(pairKey)) continue
        spousePairs.add(pairKey)
        await mockCreateRelation({
          genealogyId,
          fromPersonId: childId,
          toPersonId: spouseId,
          relType: 'spouse',
          remark: '批量导入'
        })
      }
    } catch (e: any) {
      errors.push(`${row.form.nameWei || row.personNo}：关系挂接失败 ${e?.message || ''}`)
    }
  }

  return { success, failed, errors }
}

export async function mockGetGenerationConfig(
  genealogyId: number
): Promise<Api.Genealogy.GenerationConfig> {
  await delay()
  try {
    const raw = localStorage.getItem(GEN_KEY)
    const map = raw ? (JSON.parse(raw) as Record<number, Api.Genealogy.GenerationConfig>) : {}
    return map[genealogyId] || { poem: '', startGen: 1 }
  } catch {
    return { poem: '', startGen: 1 }
  }
}

export async function mockSaveGenerationConfig(
  genealogyId: number,
  config: Api.Genealogy.GenerationConfig
): Promise<Api.Genealogy.GenerationConfig> {
  await delay()
  const raw = localStorage.getItem(GEN_KEY)
  const map = raw ? (JSON.parse(raw) as Record<number, Api.Genealogy.GenerationConfig>) : {}
  map[genealogyId] = config
  localStorage.setItem(GEN_KEY, JSON.stringify(map))
  return config
}

/** 全部人物（含回收站），供检查清单使用 */
export function readPersonsSync(genealogyId: number, includeTrash = false): Api.Person.Item[] {
  return readAll().filter((p) => p.genealogyId === genealogyId && (includeTrash || !isTrash(p)))
}
