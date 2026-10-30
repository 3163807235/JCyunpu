import { isMockEnabled } from '@/mock/auth'
import {
  EVENT_TYPE_LABELS,
  RULE_CATEGORY_LABELS,
  mockCreateFamilyEvent,
  mockCreateFamilyRule,
  mockDeleteFamilyEvent,
  mockDeleteFamilyRule,
  mockListFamilyEvents,
  mockListFamilyRules,
  mockReorderFamilyRules,
  mockUpdateFamilyEvent,
  mockUpdateFamilyRule
} from '@/mock/culture'

export { RULE_CATEGORY_LABELS, EVENT_TYPE_LABELS }

export function fetchFamilyRuleList(genealogyId: number) {
  if (isMockEnabled()) return mockListFamilyRules(genealogyId)
  throw new Error('家规家训列表接口尚未对接后端')
}

export function fetchCreateFamilyRule(
  genealogyId: number,
  params: Api.FamilyRule.FormParams,
  userId: number
) {
  if (isMockEnabled()) return mockCreateFamilyRule(genealogyId, params, userId)
  throw new Error('新增家规家训接口尚未对接后端')
}

export function fetchUpdateFamilyRule(
  id: number,
  params: Partial<Api.FamilyRule.FormParams>,
  userId: number
) {
  if (isMockEnabled()) return mockUpdateFamilyRule(id, params, userId)
  throw new Error('更新家规家训接口尚未对接后端')
}

export function fetchDeleteFamilyRule(id: number, userId: number) {
  if (isMockEnabled()) return mockDeleteFamilyRule(id, userId)
  throw new Error('删除家规家训接口尚未对接后端')
}

export function fetchReorderFamilyRules(genealogyId: number, orderedIds: number[]) {
  if (isMockEnabled()) return mockReorderFamilyRules(genealogyId, orderedIds)
  throw new Error('排序家规家训接口尚未对接后端')
}

export function fetchFamilyEventList(params: Api.FamilyEvent.ListParams) {
  if (isMockEnabled()) return mockListFamilyEvents(params)
  throw new Error('大事记列表接口尚未对接后端')
}

export function fetchCreateFamilyEvent(
  genealogyId: number,
  params: Api.FamilyEvent.FormParams,
  userId: number
) {
  if (isMockEnabled()) return mockCreateFamilyEvent(genealogyId, params, userId)
  throw new Error('新增大事记接口尚未对接后端')
}

export function fetchUpdateFamilyEvent(
  id: number,
  params: Partial<Api.FamilyEvent.FormParams>,
  userId: number
) {
  if (isMockEnabled()) return mockUpdateFamilyEvent(id, params, userId)
  throw new Error('更新大事记接口尚未对接后端')
}

export function fetchDeleteFamilyEvent(id: number, userId: number) {
  if (isMockEnabled()) return mockDeleteFamilyEvent(id, userId)
  throw new Error('删除大事记接口尚未对接后端')
}
