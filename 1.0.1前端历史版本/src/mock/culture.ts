/**
 * 家规家训 / 家族大事记 Mock
 * 依据：v3.1.6 §1.7.7–1.7.8、§3.4 页面 10
 */

import { assertSubscriptionWritable } from './subscription'
import { appendOperationLog } from './operation-log'

const RULE_KEY = 'jcyunpu_mock_family_rules'
const EVENT_KEY = 'jcyunpu_mock_family_events'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readRules(): Api.FamilyRule.Item[] {
  try {
    const raw = localStorage.getItem(RULE_KEY)
    return raw ? (JSON.parse(raw) as Api.FamilyRule.Item[]) : []
  } catch {
    return []
  }
}

function writeRules(list: Api.FamilyRule.Item[]) {
  localStorage.setItem(RULE_KEY, JSON.stringify(list))
}

function readEvents(): Api.FamilyEvent.Item[] {
  try {
    const raw = localStorage.getItem(EVENT_KEY)
    return raw ? (JSON.parse(raw) as Api.FamilyEvent.Item[]) : []
  } catch {
    return []
  }
}

function writeEvents(list: Api.FamilyEvent.Item[]) {
  localStorage.setItem(EVENT_KEY, JSON.stringify(list))
}

function nextRuleId(list: Api.FamilyRule.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 6000) + 1
}

function nextEventId(list: Api.FamilyEvent.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 7000) + 1
}

export const RULE_CATEGORY_LABELS: Record<Api.FamilyRule.Category, string> = {
  zuxun: '祖训',
  jiagui: '家规',
  jiaxun: '家训',
  zugui: '族规',
  jielv: '戒律'
}

export const EVENT_TYPE_LABELS: Record<Api.FamilyEvent.EventType, string> = {
  xiupu: '修谱',
  jisi: '祭祀',
  qianxi: '迁徙',
  hunjia: '婚嫁',
  sangzang: '丧葬',
  kekao: '科考',
  fengdeng: '封赠',
  zaihuang: '灾荒',
  jianci: '建祠',
  other: '其他'
}

export async function mockListFamilyRules(genealogyId: number): Promise<Api.FamilyRule.Item[]> {
  await delay()
  return readRules()
    .filter((r) => r.genealogyId === genealogyId && !r.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
}

export async function mockCreateFamilyRule(
  genealogyId: number,
  params: Api.FamilyRule.FormParams,
  userId: number
): Promise<Api.FamilyRule.Item> {
  await delay()
  assertSubscriptionWritable('编辑家族文化')
  if (!params.title?.trim()) throw new Error('请填写标题')
  if (!params.content?.trim()) throw new Error('请填写内容')
  const list = readRules()
  const maxSort = list
    .filter((r) => r.genealogyId === genealogyId && !r.deletedAt)
    .reduce((m, r) => Math.max(m, r.sortOrder), 0)
  const ts = nowIso()
  const item: Api.FamilyRule.Item = {
    id: nextRuleId(list),
    genealogyId,
    title: params.title.trim(),
    category: params.category,
    content: params.content,
    origin: params.origin?.trim() || '',
    sortOrder: params.sortOrder ?? maxSort + 1,
    createdBy: userId,
    updatedBy: userId,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null
  }
  writeRules([...list, item])
  appendOperationLog({
    genealogyId,
    operatorUserId: userId,
    operatorName: '用户',
    logCategory: 'data',
    action: 'family_rule.create',
    targetType: 'family_rule',
    targetId: item.id,
    changeSummary: `新增家规家训「${item.title}」`
  })
  return item
}

export async function mockUpdateFamilyRule(
  id: number,
  params: Partial<Api.FamilyRule.FormParams>,
  userId: number
): Promise<Api.FamilyRule.Item> {
  await delay()
  assertSubscriptionWritable('编辑家族文化')
  const list = readRules()
  const idx = list.findIndex((r) => r.id === id && !r.deletedAt)
  if (idx < 0) throw new Error('条目不存在')
  const prev = list[idx]
  const next: Api.FamilyRule.Item = {
    ...prev,
    title: params.title !== undefined ? params.title.trim() : prev.title,
    category: params.category ?? prev.category,
    content: params.content !== undefined ? params.content : prev.content,
    origin: params.origin !== undefined ? params.origin.trim() : prev.origin,
    sortOrder: params.sortOrder ?? prev.sortOrder,
    updatedBy: userId,
    updatedAt: nowIso()
  }
  if (!next.title) throw new Error('请填写标题')
  if (!next.content?.trim()) throw new Error('请填写内容')
  list[idx] = next
  writeRules(list)
  appendOperationLog({
    genealogyId: next.genealogyId,
    operatorUserId: userId,
    operatorName: '用户',
    logCategory: 'data',
    action: 'family_rule.update',
    targetType: 'family_rule',
    targetId: next.id,
    changeSummary: `更新家规家训「${next.title}」`
  })
  return next
}

export async function mockDeleteFamilyRule(id: number, userId: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('编辑家族文化')
  const list = readRules()
  const idx = list.findIndex((r) => r.id === id && !r.deletedAt)
  if (idx < 0) throw new Error('条目不存在')
  const item = list[idx]
  list[idx] = { ...item, deletedAt: nowIso(), updatedAt: nowIso(), updatedBy: userId }
  writeRules(list)
  appendOperationLog({
    genealogyId: item.genealogyId,
    operatorUserId: userId,
    operatorName: '用户',
    logCategory: 'data',
    action: 'family_rule.delete',
    targetType: 'family_rule',
    targetId: item.id,
    changeSummary: `删除家规家训「${item.title}」`
  })
}

export async function mockReorderFamilyRules(
  genealogyId: number,
  orderedIds: number[]
): Promise<void> {
  await delay()
  assertSubscriptionWritable('编辑家族文化')
  const list = readRules()
  orderedIds.forEach((id, i) => {
    const idx = list.findIndex((r) => r.id === id && r.genealogyId === genealogyId)
    if (idx >= 0) list[idx] = { ...list[idx], sortOrder: i + 1, updatedAt: nowIso() }
  })
  writeRules(list)
}

export async function mockListFamilyEvents(
  params: Api.FamilyEvent.ListParams
): Promise<Api.FamilyEvent.Item[]> {
  await delay()
  let list = readEvents().filter((e) => e.genealogyId === params.genealogyId && !e.deletedAt)
  if (params.eventType) list = list.filter((e) => e.eventType === params.eventType)
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim().toLowerCase()
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(kw) ||
        e.eventDate.toLowerCase().includes(kw) ||
        (e.description || '').toLowerCase().includes(kw)
    )
  }
  return list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
}

export async function mockCreateFamilyEvent(
  genealogyId: number,
  params: Api.FamilyEvent.FormParams,
  userId: number
): Promise<Api.FamilyEvent.Item> {
  await delay()
  assertSubscriptionWritable('编辑家族文化')
  if (!params.title?.trim()) throw new Error('请填写事件标题')
  if (!params.eventDate?.trim()) throw new Error('请填写事件日期')
  const list = readEvents()
  const maxSort = list
    .filter((e) => e.genealogyId === genealogyId && !e.deletedAt)
    .reduce((m, e) => Math.max(m, e.sortOrder), 0)
  const ts = nowIso()
  const item: Api.FamilyEvent.Item = {
    id: nextEventId(list),
    genealogyId,
    eventDate: params.eventDate.trim(),
    eventType: params.eventType,
    title: params.title.trim(),
    description: params.description || '',
    relatedPersonIds: params.relatedPersonIds || [],
    relatedAttachmentIds: [],
    sortOrder: params.sortOrder ?? maxSort + 1,
    createdBy: userId,
    updatedBy: userId,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null
  }
  writeEvents([...list, item])
  appendOperationLog({
    genealogyId,
    operatorUserId: userId,
    operatorName: '用户',
    logCategory: 'data',
    action: 'family_event.create',
    targetType: 'family_event',
    targetId: item.id,
    changeSummary: `新增大事记「${item.title}」`
  })
  return item
}

export async function mockUpdateFamilyEvent(
  id: number,
  params: Partial<Api.FamilyEvent.FormParams>,
  userId: number
): Promise<Api.FamilyEvent.Item> {
  await delay()
  assertSubscriptionWritable('编辑家族文化')
  const list = readEvents()
  const idx = list.findIndex((e) => e.id === id && !e.deletedAt)
  if (idx < 0) throw new Error('事件不存在')
  const prev = list[idx]
  const next: Api.FamilyEvent.Item = {
    ...prev,
    eventDate: params.eventDate !== undefined ? params.eventDate.trim() : prev.eventDate,
    eventType: params.eventType ?? prev.eventType,
    title: params.title !== undefined ? params.title.trim() : prev.title,
    description: params.description !== undefined ? params.description : prev.description,
    relatedPersonIds:
      params.relatedPersonIds !== undefined ? params.relatedPersonIds : prev.relatedPersonIds,
    sortOrder: params.sortOrder ?? prev.sortOrder,
    updatedBy: userId,
    updatedAt: nowIso()
  }
  if (!next.title) throw new Error('请填写事件标题')
  if (!next.eventDate) throw new Error('请填写事件日期')
  list[idx] = next
  writeEvents(list)
  appendOperationLog({
    genealogyId: next.genealogyId,
    operatorUserId: userId,
    operatorName: '用户',
    logCategory: 'data',
    action: 'family_event.update',
    targetType: 'family_event',
    targetId: next.id,
    changeSummary: `更新大事记「${next.title}」`
  })
  return next
}

export async function mockDeleteFamilyEvent(id: number, userId: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('编辑家族文化')
  const list = readEvents()
  const idx = list.findIndex((e) => e.id === id && !e.deletedAt)
  if (idx < 0) throw new Error('事件不存在')
  const item = list[idx]
  list[idx] = { ...item, deletedAt: nowIso(), updatedAt: nowIso(), updatedBy: userId }
  writeEvents(list)
  appendOperationLog({
    genealogyId: item.genealogyId,
    operatorUserId: userId,
    operatorName: '用户',
    logCategory: 'data',
    action: 'family_event.delete',
    targetType: 'family_event',
    targetId: item.id,
    changeSummary: `删除大事记「${item.title}」`
  })
}

/** 供分享页同步读取（无 delay） */
export function listFamilyRulesSync(genealogyId: number) {
  return readRules()
    .filter((r) => r.genealogyId === genealogyId && !r.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
}

export function listFamilyEventsSync(genealogyId: number) {
  return readEvents()
    .filter((e) => e.genealogyId === genealogyId && !e.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
}
