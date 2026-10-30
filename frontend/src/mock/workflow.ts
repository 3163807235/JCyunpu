/**
 * 校对 / 排版 / 归档 Mock（Sprint 4 / Sprint M）
 */

import { readPersonsSync } from './person'
import { readChaptersSync } from './chapter'
import { readRelationsSync } from './relationship'
import { assertPremiumExportAllowed, assertSubscriptionWritable } from './subscription'

const REVIEW_KEY = 'jcyunpu_mock_review'
const LAYOUT_KEY = 'jcyunpu_mock_layout'
const SNAPSHOT_KEY = 'jcyunpu_mock_snapshots'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export interface ReviewState {
  finalPassed: boolean
  finalPassedAt?: string
  logs: Api.Review.LogItem[]
}

export interface LayoutState {
  layoutType: 'dieji' | 'sushi' | 'oushi' | 'baota'
  locked: boolean
  lockedAt?: string
  pageCount: number
  pdfJobs: Api.Layout.PdfJob[]
}

function readReviewMap(): Record<number, ReviewState> {
  try {
    const raw = localStorage.getItem(REVIEW_KEY)
    return raw ? (JSON.parse(raw) as Record<number, ReviewState>) : {}
  } catch {
    return {}
  }
}

function writeReviewMap(map: Record<number, ReviewState>) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(map))
}

function ensureReview(genealogyId: number): ReviewState {
  const map = readReviewMap()
  if (!map[genealogyId]) {
    map[genealogyId] = { finalPassed: false, logs: [] }
    writeReviewMap(map)
  }
  return map[genealogyId]
}

function readLayoutMap(): Record<number, LayoutState> {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    return raw ? (JSON.parse(raw) as Record<number, LayoutState>) : {}
  } catch {
    return {}
  }
}

function writeLayoutMap(map: Record<number, LayoutState>) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(map))
}

function ensureLayout(genealogyId: number): LayoutState {
  const map = readLayoutMap()
  if (!map[genealogyId]) {
    map[genealogyId] = {
      layoutType: 'dieji',
      locked: false,
      pageCount: 0,
      pdfJobs: []
    }
    writeLayoutMap(map)
  }
  return map[genealogyId]
}

function readSnapshots(): Api.Archive.Snapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as Api.Archive.Snapshot[]) : []
  } catch {
    return []
  }
}

function writeSnapshots(list: Api.Archive.Snapshot[]) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list))
}

function appendLog(
  genealogyId: number,
  action: string,
  target: string,
  remark = '',
  before = '',
  after = ''
) {
  const map = readReviewMap()
  const state = ensureReview(genealogyId)
  state.logs.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    genealogyId,
    action,
    target,
    remark,
    before,
    after,
    operator: '拥有者（代行）',
    createdAt: nowIso()
  })
  map[genealogyId] = state
  writeReviewMap(map)
}

/** ---------- 审核 ---------- */

export async function mockGetReviewState(genealogyId: number): Promise<ReviewState> {
  await delay()
  return { ...ensureReview(genealogyId), logs: [...ensureReview(genealogyId).logs] }
}

export async function mockListPendingReview(
  genealogyId: number
): Promise<Api.Review.PendingItem[]> {
  await delay()
  const persons = readPersonsSync(genealogyId)
  const chapters = readChaptersSync(genealogyId)
  const items: Api.Review.PendingItem[] = []

  persons.forEach((p) => {
    if (p.reviewStatus === 0 || p.reviewStatus === 3) {
      items.push({
        id: `person-${p.id}`,
        targetType: 'person',
        targetId: p.id,
        title: p.nameWei,
        detail: `第${p.generation}世 · ${p.reviewStatus === 3 ? '待整改' : '未审核'}`,
        status: p.reviewStatus
      })
    }
  })

  chapters.forEach((c) => {
    const text = c.contentHtml.replace(/<[^>]+>/g, '').trim()
    if (!text) {
      items.push({
        id: `chapter-${c.id}`,
        targetType: 'chapter',
        targetId: c.id,
        title: c.title,
        detail: '章节正文为空，待审',
        status: 0
      })
    }
  })

  return items
}

export async function mockListDoubtItems(genealogyId: number): Promise<Api.Review.DoubtItem[]> {
  await delay()
  return readPersonsSync(genealogyId)
    .filter((p) => p.reviewStatus === 2 || p.zibeiDoubt)
    .map((p) => ({
      id: p.id,
      nameWei: p.nameWei,
      generation: p.generation,
      reason: p.reviewNote || '字辈存疑',
      note: p.reviewNote || '',
      resolved: false
    }))
}

export async function mockReviewPerson(
  genealogyId: number,
  personId: number,
  status: Api.Person.ReviewStatus,
  note = ''
): Promise<void> {
  await delay()
  const raw = localStorage.getItem('jcyunpu_mock_persons')
  if (!raw) throw new Error('人物数据不存在')
  const list = JSON.parse(raw) as Api.Person.Item[]
  const idx = list.findIndex((p) => p.id === personId && p.genealogyId === genealogyId)
  if (idx < 0) throw new Error('人物不存在')
  const before = String(list[idx].reviewStatus)
  list[idx] = {
    ...list[idx],
    reviewStatus: status,
    reviewNote: note,
    zibeiDoubt: status === 2 ? true : status === 1 ? false : list[idx].zibeiDoubt,
    updatedAt: nowIso()
  }
  localStorage.setItem('jcyunpu_mock_persons', JSON.stringify(list))

  const actionMap: Record<number, string> = {
    1: '审核通过',
    2: '标记存疑',
    3: '驳回整改',
    0: '重置未审'
  }
  appendLog(genealogyId, actionMap[status] || '审核', list[idx].nameWei, note, before, String(status))

  // 有新的待处理操作则取消终审放行
  const map = readReviewMap()
  const state = ensureReview(genealogyId)
  if (state.finalPassed && status !== 1) {
    state.finalPassed = false
    state.finalPassedAt = undefined
    map[genealogyId] = state
    writeReviewMap(map)
  }
}

export async function mockResolveDoubt(
  genealogyId: number,
  personId: number,
  pass: boolean,
  note: string
): Promise<void> {
  await mockReviewPerson(genealogyId, personId, pass ? 1 : 2, note)
}

export async function mockFinalPass(genealogyId: number): Promise<ReviewState> {
  await delay()
  assertSubscriptionWritable('终审放行')
  const persons = readPersonsSync(genealogyId)
  const doubts = persons.filter((p) => p.reviewStatus === 2 || p.zibeiDoubt)
  const pending = persons.filter((p) => p.reviewStatus === 0 || p.reviewStatus === 3)
  if (pending.length) {
    throw new Error(`仍有 ${pending.length} 条未审/待整改，无法终审放行`)
  }
  const ratio = persons.length ? doubts.length / persons.length : 0
  if (ratio > 0.05) {
    throw new Error(
      `存疑人物占比 ${(ratio * 100).toFixed(1)}% 超过 5% 上限，请解除存疑或确认归档后重试`
    )
  }
  // 存疑须有原因
  const noReason = doubts.find((p) => !p.reviewNote?.trim())
  if (noReason) {
    throw new Error(`存疑人物「${noReason.nameWei}」缺少存疑原因与考证备注`)
  }

  const map = readReviewMap()
  const state = ensureReview(genealogyId)
  state.finalPassed = true
  state.finalPassedAt = nowIso()
  map[genealogyId] = state
  writeReviewMap(map)
  appendLog(genealogyId, '终审放行', '项目', '拥有者代行终审通过')
  return state
}

export function canAdvanceToLayout(genealogyId: number, mode: Api.Genealogy.Mode): string | null {
  if (mode === 'simple') return null
  const state = ensureReview(genealogyId)
  if (!state.finalPassed) return '请先完成校对终审放行'
  return null
}

/** ---------- 排版 ---------- */

export async function mockGetLayoutState(genealogyId: number): Promise<LayoutState> {
  await delay()
  const state = ensureLayout(genealogyId)
  // 预估页数：人物/20 + 章节
  const persons = readPersonsSync(genealogyId).length
  const chapters = readChaptersSync(genealogyId).length
  state.pageCount = Math.max(1, Math.ceil(persons / 20) + chapters + 2)
  return { ...state, pdfJobs: [...state.pdfJobs] }
}

export async function mockSetLayoutType(
  genealogyId: number,
  layoutType: LayoutState['layoutType']
): Promise<LayoutState> {
  await delay()
  const map = readLayoutMap()
  const state = ensureLayout(genealogyId)
  if (state.locked) throw new Error('版式已锁定，请先解锁（将回退至校对）')
  if (layoutType !== 'dieji') {
    throw new Error('MVP 仅开放牒记式；苏式/欧式/宝塔为 V1.5 或 Spike')
  }
  state.layoutType = layoutType
  map[genealogyId] = state
  writeLayoutMap(map)
  return state
}

export async function mockLockLayout(genealogyId: number): Promise<LayoutState> {
  await delay()
  assertPremiumExportAllowed()
  const map = readLayoutMap()
  const state = ensureLayout(genealogyId)
  if (state.locked) return state
  const persons = readPersonsSync(genealogyId).length
  const chapters = readChaptersSync(genealogyId).length
  state.locked = true
  state.lockedAt = nowIso()
  state.pageCount = Math.max(1, Math.ceil(persons / 20) + chapters + 2)
  map[genealogyId] = state
  writeLayoutMap(map)
  return state
}

export async function mockUnlockLayout(genealogyId: number): Promise<LayoutState> {
  await delay()
  const map = readLayoutMap()
  const state = ensureLayout(genealogyId)
  state.locked = false
  state.lockedAt = undefined
  map[genealogyId] = state
  writeLayoutMap(map)

  // 解锁需回退审核终审
  const rMap = readReviewMap()
  const rState = ensureReview(genealogyId)
  rState.finalPassed = false
  rState.finalPassedAt = undefined
  rMap[genealogyId] = rState
  writeReviewMap(rMap)
  appendLog(genealogyId, '解锁版式', '排版', '解锁后需重新终审')

  return state
}

export async function mockCreatePdfJob(genealogyId: number): Promise<Api.Layout.PdfJob> {
  await delay()
  assertPremiumExportAllowed()
  const map = readLayoutMap()
  const state = ensureLayout(genealogyId)
  if (!state.locked) throw new Error('请先锁定版式后再导出 PDF')

  const job: Api.Layout.PdfJob = {
    id: Date.now(),
    genealogyId,
    status: 'running',
    progress: 0,
    createdAt: nowIso()
  }
  state.pdfJobs.unshift(job)
  map[genealogyId] = state
  writeLayoutMap(map)

  // 模拟异步进度
  const tick = (progress: number) => {
    const m = readLayoutMap()
    const s = ensureLayout(genealogyId)
    const idx = s.pdfJobs.findIndex((j) => j.id === job.id)
    if (idx < 0) return
    s.pdfJobs[idx] = {
      ...s.pdfJobs[idx],
      progress,
      status: progress >= 100 ? 'done' : 'running',
      downloadUrl: progress >= 100 ? `mock://pdf/${genealogyId}/${job.id}.pdf` : undefined,
      finishedAt: progress >= 100 ? nowIso() : undefined
    }
    m[genealogyId] = s
    writeLayoutMap(m)
  }
  setTimeout(() => tick(35), 400)
  setTimeout(() => tick(70), 900)
  setTimeout(() => tick(100), 1500)

  return job
}

export function canAdvanceToArchive(genealogyId: number): string | null {
  const state = ensureLayout(genealogyId)
  if (!state.locked) return '请先完成版式锁定'
  return null
}

/** ---------- 归档 ---------- */

export async function mockListSnapshots(genealogyId: number): Promise<Api.Archive.Snapshot[]> {
  await delay()
  return readSnapshots()
    .filter((s) => s.genealogyId === genealogyId)
    .sort((a, b) => b.batchNo - a.batchNo)
}

export async function mockPublishArchive(
  genealogyId: number,
  privacy: Api.Genealogy.Privacy,
  genealogyName: string
): Promise<Api.Archive.Snapshot> {
  await delay()
  assertSubscriptionWritable('发布归档')
  const layout = ensureLayout(genealogyId)
  if (!layout.locked) throw new Error('请先锁定版式后再归档')

  const persons = readPersonsSync(genealogyId)
  const chapters = readChaptersSync(genealogyId)
  const relations = readRelationsSync(genealogyId)
  const existing = readSnapshots().filter((s) => s.genealogyId === genealogyId)
  const batchNo = existing.length + 1

  const snapshot: Api.Archive.Snapshot = {
    id: Date.now(),
    genealogyId,
    batchNo,
    title: `${genealogyName}·第${batchNo}期归档`,
    layoutType: layout.layoutType,
    pageCount: layout.pageCount,
    personCount: persons.length,
    chapterCount: chapters.length,
    relationCount: relations.length,
    privacy,
    operator: '拥有者',
    createdAt: nowIso(),
    summary: `人物 ${persons.length} 人，章节 ${chapters.length}，关系 ${relations.length}，版式牒记式`
  }

  const list = readSnapshots()
  list.push(snapshot)
  writeSnapshots(list)

  // 归档后保持锁定；标记族谱阶段已在外部 setStage(6)
  return snapshot
}

/** 牒记式预览条目 */
export async function mockDiejiPreview(genealogyId: number): Promise<Api.Layout.DiejiEntry[]> {
  await delay()
  const persons = [...readPersonsSync(genealogyId)].sort(
    (a, b) => a.generation - b.generation || a.id - b.id
  )
  return persons.map((p) => {
    const parts: string[] = []
    if (p.nameZi) parts.push(`字${p.nameZi}`)
    if (p.nameHao) parts.push(`号${p.nameHao}`)
    if (p.zibei) parts.push(`字辈${p.zibei}`)
    if (p.birthDate) parts.push(`生于${p.birthDate}`)
    if (p.deathDate) parts.push(`卒于${p.deathDate}`)
    if (!p.birthDate && !p.deathDate) parts.push('生卒未详')
    if (p.nativePlace) parts.push(`籍${p.nativePlace}`)
    if (p.burialPlace) parts.push(`葬${p.burialPlace}`)
    if (p.biography) parts.push(p.biography.replace(/<[^>]+>/g, '').slice(0, 80))
    return {
      generation: p.generation,
      title: p.nameWei + (parts[0] && p.nameZi ? `（${p.nameZi}）` : ''),
      body: parts.join('，') + '。'
    }
  })
}
