/**
 * 族谱 Mock（localStorage 持久化）
 * MVP：max_genealogy_count = 1
 * Sprint M：currentStage 1–5（v3.1.6）
 */

import { MOCK_SMS_CODE } from './auth'
import { ensureGenealogyNo, genealogyNoFromId } from '@/utils/genealogy/genealogy-no'
import { migrateLegacyStage } from '@/utils/genealogy/stage'
import { appendOperationLog } from './operation-log'
import {
  enrichGenealogyItem,
  ensureDemoMemberGenealogy,
  ensureInviteCodeForGenealogy,
  listAccessibleGenealogyIds,
  MOCK_CURRENT_USER_ID
} from './member'

const STORAGE_KEY = 'jcyunpu_mock_genealogies'
const PROJECT_KEY = 'jcyunpu_mock_projects'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export const MOCK_MAX_GENEALOGY_COUNT = 1

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function normalizeItem(item: Api.Genealogy.Item): Api.Genealogy.Item {
  const livingDesensitize = (item.livingDesensitize ?? 1) as Api.Genealogy.LivingDesensitize
  const genealogyNo = ensureGenealogyNo(item)
  if (item.stageSchema === 2) {
    return { ...item, genealogyNo, layoutDirty: item.layoutDirty ?? 0, livingDesensitize }
  }
  return {
    ...item,
    genealogyNo,
    currentStage: migrateLegacyStage(item.currentStage as number),
    stageSchema: 2,
    layoutDirty: item.layoutDirty ?? 0,
    livingDesensitize
  }
}

function readList(): Api.Genealogy.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? (JSON.parse(raw) as Api.Genealogy.Item[]) : []
    let changed = false
    const next = list.map((item) => {
      const n = normalizeItem(item)
      if (
        n.currentStage !== item.currentStage ||
        n.stageSchema !== item.stageSchema ||
        (n.layoutDirty ?? 0) !== (item.layoutDirty ?? 0) ||
        (n.livingDesensitize ?? 1) !== (item.livingDesensitize ?? 1) ||
        n.genealogyNo !== item.genealogyNo
      ) {
        changed = true
      }
      return n
    })
    if (changed) writeList(next)
    return next
  } catch {
    return []
  }
}

function writeList(list: Api.Genealogy.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function readProjects(): Record<number, Api.Genealogy.ProjectInfo> {
  try {
    const raw = localStorage.getItem(PROJECT_KEY)
    return raw ? (JSON.parse(raw) as Record<number, Api.Genealogy.ProjectInfo>) : {}
  } catch {
    return {}
  }
}

function writeProjects(map: Record<number, Api.Genealogy.ProjectInfo>) {
  localStorage.setItem(PROJECT_KEY, JSON.stringify(map))
}

function nextId(list: Api.Genealogy.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 1000) + 1
}

function isInTrash(item: Api.Genealogy.Item) {
  return !!item.deletedAt
}

import {
  assertSubscriptionWritable,
  getSubscriptionSummarySync,
  mockGetSubscriptionSummary as mockGetSubscriptionSummaryFromStore
} from './subscription'

/** @deprecated 请优先使用 mock/subscription；保留导出兼容旧 import */
export async function mockGetSubscriptionSummary(): Promise<Api.Subscription.Summary> {
  return mockGetSubscriptionSummaryFromStore()
}

export async function mockListGenealogies(
  params: Api.Genealogy.ListParams = {}
): Promise<Api.Common.PaginatedResponse<Api.Genealogy.Item>> {
  await delay()
  ensureDemoMemberGenealogy()
  const current = params.current || 1
  const size = params.size || 10
  const scope = params.scope || 'active'
  const keyword = (params.keyword || '').trim()
  const { ownedIds, memberIds } = listAccessibleGenealogyIds()

  let list = readList().filter((item) => {
    const inScope = scope === 'trash' ? isInTrash(item) : !isInTrash(item)
    if (!inScope) return false
    if (scope === 'trash') return ownedIds.has(item.id)
    return ownedIds.has(item.id) || memberIds.has(item.id)
  })

  if (keyword) {
    list = list.filter(
      (item) =>
        item.name.includes(keyword) ||
        (item.hallName || '').includes(keyword) ||
        (item.ancestor || '').includes(keyword)
    )
  }

  list = [...list].sort((a, b) =>
    (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
  )

  const start = (current - 1) * size
  const records = list.slice(start, start + size).map((item) => enrichGenealogyItem(item))

  return {
    records,
    current,
    size,
    total: list.length
  }
}

export async function mockGetGenealogy(id: number): Promise<Api.Genealogy.Item> {
  await delay()
  ensureDemoMemberGenealogy()
  const item = readList().find((g) => g.id === id && !isInTrash(g))
  if (!item) throw new Error('族谱不存在或已删除')
  const enriched = enrichGenealogyItem(item)
  if (!enriched.membership) throw new Error('无权访问该族谱')
  return enriched
}

export async function mockCreateGenealogy(
  params: Api.Genealogy.CreateParams
): Promise<Api.Genealogy.Item> {
  await delay()
  assertSubscriptionWritable('新建族谱')
  const summary = getSubscriptionSummarySync()
  if (summary.personUsed >= summary.personLimit) {
    throw new Error('人物额度已用尽，禁止新建族谱，请先扩容')
  }
  const list = readList()
  const { ownedIds } = listAccessibleGenealogyIds()
  const activeOwned = list.filter((g) => !isInTrash(g) && ownedIds.has(g.id)).length
  const maxCount = Math.min(summary.maxGenealogyCount || 1, MOCK_MAX_GENEALOGY_COUNT)
  if (activeOwned >= maxCount) {
    throw new Error(`当前套餐最多创建 ${maxCount} 个族谱`)
  }
  if (!params.name?.trim()) throw new Error('请填写族谱名称')
  if (!params.surname?.trim()) throw new Error('请填写姓氏')

  const createdAt = nowIso()
  const id = nextId(list)
  const item: Api.Genealogy.Item = {
    id,
    genealogyNo: genealogyNoFromId(id),
    name: params.name.trim(),
    surname: params.surname.trim(),
    hallName: params.hallName?.trim() || '',
    ancestor: params.ancestor?.trim() || '',
    privacy: params.privacy,
    livingDesensitize: params.livingDesensitize ?? 1,
    mode: params.mode,
    personCount: 0,
    attachmentCount: 0,
    projectCount: 1,
    currentStage: 1,
    stageSchema: 2,
    layoutDirty: 0,
    ownerUserId: MOCK_CURRENT_USER_ID,
    membership: 'owner',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null
  }
  list.push(item)
  writeList(list)
  ensureInviteCodeForGenealogy(item.id, MOCK_CURRENT_USER_ID)

  // 建谱占位草稿：阶段停在项目启动，但须用户显式「创建修谱项目」后才出期次卡片
  const projects = readProjects()
  projects[item.id] = {
    name: '',
    yearGanZhi: '',
    yearAd: new Date().getFullYear(),
    projectType: 1,
    fanliHtml: '',
    collabPhones: [],
    chiefEditorByOwner: true,
    chiefEditorName: '',
    chiefEditorPhone: '',
    editors: [],
    initialized: false
  }
  writeProjects(projects)

  return item
}

export async function mockUpdateGenealogy(
  id: number,
  params: Api.Genealogy.UpdateParams
): Promise<Api.Genealogy.Item> {
  await delay()
  assertSubscriptionWritable('编辑族谱')
  const list = readList()
  const idx = list.findIndex((g) => g.id === id && !isInTrash(g))
  if (idx < 0) throw new Error('族谱不存在')
  const prev = list[idx]

  if (params.mode != null && params.mode !== prev.mode) {
    if (!(prev.mode === 'simple' && params.mode === 'standard')) {
      throw new Error('修谱模式仅支持从简易升级为标准，不可降级')
    }
  }

  const next: Api.Genealogy.Item = {
    ...prev,
    ...params,
    name: params.name?.trim() ?? prev.name,
    surname: params.surname !== undefined ? params.surname.trim() : prev.surname,
    hallName: params.hallName !== undefined ? params.hallName.trim() : prev.hallName,
    ancestor: params.ancestor !== undefined ? params.ancestor.trim() : prev.ancestor,
    privacy: params.privacy ?? prev.privacy,
    livingDesensitize: params.livingDesensitize ?? prev.livingDesensitize ?? 1,
    mode: params.mode ?? prev.mode,
    updatedAt: nowIso()
  }
  list[idx] = next
  writeList(list)

  const detail: Record<string, { before?: unknown; after?: unknown }> = {}
  if (params.name !== undefined && prev.name !== next.name) {
    detail.name = { before: prev.name, after: next.name }
  }
  if (params.surname !== undefined && prev.surname !== next.surname) {
    detail.surname = { before: prev.surname, after: next.surname }
  }
  if (params.hallName !== undefined && prev.hallName !== next.hallName) {
    detail.hallName = { before: prev.hallName, after: next.hallName }
  }
  if (params.ancestor !== undefined && prev.ancestor !== next.ancestor) {
    detail.ancestor = { before: prev.ancestor, after: next.ancestor }
  }
  if (params.privacy !== undefined && prev.privacy !== next.privacy) {
    detail.privacy = { before: prev.privacy, after: next.privacy }
  }
  if (
    params.livingDesensitize !== undefined &&
    (prev.livingDesensitize ?? 1) !== (next.livingDesensitize ?? 1)
  ) {
    detail.livingDesensitize = {
      before: prev.livingDesensitize ?? 1,
      after: next.livingDesensitize ?? 1
    }
  }
  if (params.mode !== undefined && prev.mode !== next.mode) {
    detail.mode = { before: prev.mode, after: next.mode }
  }

  if (Object.keys(detail).length) {
    const keys = Object.keys(detail)
    const isPrivacyOnly = keys.every((k) => k === 'privacy' || k === 'livingDesensitize')
    appendOperationLog({
      genealogyId: id,
      operatorUserId: 10001,
      operatorName: '拥有者',
      logCategory: 'setting',
      action: isPrivacyOnly ? 'genealogy.privacy.update' : 'genealogy.update',
      targetType: 'genealogy',
      targetId: id,
      changeSummary: isPrivacyOnly ? '更新隐私与脱敏设置' : '更新族谱基础设置',
      changeDetail: detail
    })
  }

  return next
}

export async function mockSoftDeleteGenealogy(id: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('删除族谱')
  const list = readList()
  const idx = list.findIndex((g) => g.id === id && !isInTrash(g))
  if (idx < 0) throw new Error('族谱不存在')
  list[idx] = { ...list[idx], deletedAt: nowIso(), updatedAt: nowIso() }
  writeList(list)
}

export async function mockRestoreGenealogy(id: number): Promise<Api.Genealogy.Item> {
  await delay()
  const list = readList()
  const activeCount = list.filter((g) => !isInTrash(g)).length
  if (activeCount >= MOCK_MAX_GENEALOGY_COUNT) {
    throw new Error(`已达族谱上限 ${MOCK_MAX_GENEALOGY_COUNT}，请先删除或彻底清理后再恢复`)
  }
  const idx = list.findIndex((g) => g.id === id && isInTrash(g))
  if (idx < 0) throw new Error('回收站中未找到该族谱')
  list[idx] = { ...list[idx], deletedAt: null, updatedAt: nowIso() }
  writeList(list)
  return list[idx]
}

export async function mockPurgeGenealogy(id: number, smsCode: string): Promise<void> {
  await delay()
  if (smsCode !== MOCK_SMS_CODE) {
    throw new Error('验证码错误（Mock 固定为 123456）')
  }
  const list = readList().filter((g) => g.id !== id)
  writeList(list)
  const projects = readProjects()
  delete projects[id]
  writeProjects(projects)
}

export async function mockUpdateStage(
  id: number,
  stage: Api.Genealogy.Stage
): Promise<Api.Genealogy.Item> {
  await delay()
  assertSubscriptionWritable('推进修谱阶段')
  const list = readList()
  const idx = list.findIndex((g) => g.id === id && !isInTrash(g))
  if (idx < 0) throw new Error('族谱不存在')
  const item = list[idx]
  // 简易模式：编排→排版时批量视为已校对通过
  if (item.mode === 'simple' && stage === 4 && item.currentStage === 2) {
    const { markAllPersonsReviewed } = await import('./person')
    markAllPersonsReviewed(id)
  }
  list[idx] = {
    ...item,
    currentStage: stage,
    stageSchema: 2,
    updatedAt: nowIso(),
    ...(stage === 3 ? { layoutDirty: 0 as const } : {})
  }
  writeList(list)
  return list[idx]
}

/** 活数据变更钩子（兼容导出；规则已内聚在 person mock） */
export function onGenealogyLiveDataChanged(genealogyId: number, personIds?: number[]) {
  void import('./person').then(({ resetPersonsReviewStatus }) => {
    const list = readList()
    const idx = list.findIndex((g) => g.id === genealogyId && !isInTrash(g))
    if (idx < 0) return
    const stage = list[idx].currentStage
    if (stage === 3 || stage === 4) {
      resetPersonsReviewStatus(genealogyId, personIds)
    }
    if (stage === 4) {
      list[idx] = { ...list[idx], layoutDirty: 1, updatedAt: nowIso() }
      writeList(list)
    }
  })
}

export function mockSetLayoutDirty(id: number, dirty: 0 | 1): Api.Genealogy.Item | null {
  const list = readList()
  const idx = list.findIndex((g) => g.id === id && !isInTrash(g))
  if (idx < 0) return null
  list[idx] = { ...list[idx], layoutDirty: dirty, updatedAt: nowIso() }
  writeList(list)
  return list[idx]
}

/** 兼容旧项目快照：补齐组编字段，并把 collabPhones 迁移到 editors */
function normalizeProjectInfo(raw: Api.Genealogy.ProjectInfo): Api.Genealogy.ProjectInfo {
  const editors =
    raw.editors?.length
      ? raw.editors.map((e) => ({
          phone: e.phone,
          displayName: e.displayName || ''
        }))
      : (raw.collabPhones || []).map((phone) => ({ phone, displayName: '' }))
  // 旧数据无 initialized 字段：有名称则视为已创建，避免已有族谱丢卡片
  const initialized =
    raw.initialized === true || (raw.initialized !== false && !!raw.name?.trim())
  return {
    ...raw,
    chiefEditorByOwner: raw.chiefEditorByOwner !== false,
    chiefEditorName: raw.chiefEditorName || '',
    chiefEditorPhone: raw.chiefEditorPhone || '',
    editors,
    collabPhones: editors.map((e) => e.phone),
    initialized
  }
}

function emptyProjectDraft(yearAd = new Date().getFullYear()): Api.Genealogy.ProjectInfo {
  return {
    name: '',
    yearGanZhi: '',
    yearAd,
    projectType: 1,
    fanliHtml: '',
    collabPhones: [],
    chiefEditorByOwner: true,
    chiefEditorName: '',
    chiefEditorPhone: '',
    editors: [],
    initialized: false
  }
}

export async function mockGetProject(id: number): Promise<Api.Genealogy.ProjectInfo> {
  await delay()
  const projects = readProjects()
  if (!projects[id]) {
    return emptyProjectDraft()
  }
  return normalizeProjectInfo(projects[id])
}

export async function mockSaveProject(
  id: number,
  data: Api.Genealogy.ProjectInfo
): Promise<Api.Genealogy.ProjectInfo> {
  await delay()
  assertSubscriptionWritable('保存项目')
  const projects = readProjects()
  const normalized = normalizeProjectInfo({
    ...data,
    // 显式保存即视为已创建（创建弹窗 / 编辑保存）
    initialized: data.initialized !== false
  })
  if (!normalized.name?.trim()) {
    throw new Error('请填写项目名称')
  }
  projects[id] = normalized
  writeProjects(projects)
  return normalized
}

/** 供流程推进校验：是否已在项目启动页显式创建 */
export function mockIsProjectInitialized(genealogyId: number): boolean {
  const projects = readProjects()
  const raw = projects[genealogyId]
  if (!raw) return false
  return normalizeProjectInfo(raw).initialized === true
}

export function mockActiveGenealogyCount(): number {
  return readList().filter((g) => !isInTrash(g)).length
}
