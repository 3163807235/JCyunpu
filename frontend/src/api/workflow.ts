import { isMockEnabled } from '@/mock/auth'
import {
  mockCreatePdfJob,
  mockDiejiPreview,
  mockFinalPass,
  mockGetLayoutState,
  mockGetReviewState,
  mockListDoubtItems,
  mockListPendingReview,
  mockListSnapshots,
  mockLockLayout,
  mockPublishArchive,
  mockResolveDoubt,
  mockReviewPerson,
  mockSetLayoutType,
  mockUnlockLayout,
  canAdvanceToArchive,
  canAdvanceToLayout
} from '@/mock/workflow'

export function fetchPendingReview(genealogyId: number) {
  if (isMockEnabled()) return mockListPendingReview(genealogyId)
  throw new Error('待审列表接口尚未对接')
}

export function fetchDoubtList(genealogyId: number) {
  if (isMockEnabled()) return mockListDoubtItems(genealogyId)
  throw new Error('疑点台账接口尚未对接')
}

export function fetchReviewState(genealogyId: number) {
  if (isMockEnabled()) return mockGetReviewState(genealogyId)
  throw new Error('审核状态接口尚未对接')
}

export function fetchReviewPerson(
  genealogyId: number,
  personId: number,
  status: Api.Person.ReviewStatus,
  note?: string
) {
  if (isMockEnabled()) return mockReviewPerson(genealogyId, personId, status, note)
  throw new Error('审核人物接口尚未对接')
}

export function fetchResolveDoubt(
  genealogyId: number,
  personId: number,
  pass: boolean,
  note: string
) {
  if (isMockEnabled()) return mockResolveDoubt(genealogyId, personId, pass, note)
  throw new Error('疑点处理接口尚未对接')
}

export function fetchFinalPass(genealogyId: number) {
  if (isMockEnabled()) return mockFinalPass(genealogyId)
  throw new Error('终审放行接口尚未对接')
}

export function fetchLayoutState(genealogyId: number) {
  if (isMockEnabled()) return mockGetLayoutState(genealogyId)
  throw new Error('排版状态接口尚未对接')
}

export function fetchSetLayoutType(genealogyId: number, layoutType: Api.Layout.LayoutType) {
  if (isMockEnabled()) return mockSetLayoutType(genealogyId, layoutType)
  throw new Error('设置版式接口尚未对接')
}

export function fetchLockLayout(genealogyId: number) {
  if (isMockEnabled()) return mockLockLayout(genealogyId)
  throw new Error('锁定版式接口尚未对接')
}

export function fetchUnlockLayout(genealogyId: number) {
  if (isMockEnabled()) return mockUnlockLayout(genealogyId)
  throw new Error('解锁版式接口尚未对接')
}

export function fetchCreatePdfJob(genealogyId: number) {
  if (isMockEnabled()) return mockCreatePdfJob(genealogyId)
  throw new Error('PDF 任务接口尚未对接')
}

export function fetchDiejiPreview(genealogyId: number) {
  if (isMockEnabled()) return mockDiejiPreview(genealogyId)
  throw new Error('牒记预览接口尚未对接')
}

export function fetchSnapshots(genealogyId: number) {
  if (isMockEnabled()) return mockListSnapshots(genealogyId)
  throw new Error('版本快照接口尚未对接')
}

export function fetchPublishArchive(
  genealogyId: number,
  privacy: Api.Genealogy.Privacy,
  genealogyName: string
) {
  if (isMockEnabled()) return mockPublishArchive(genealogyId, privacy, genealogyName)
  throw new Error('发布归档接口尚未对接')
}

export function checkAdvanceToLayout(genealogyId: number, mode: Api.Genealogy.Mode) {
  return canAdvanceToLayout(genealogyId, mode)
}

export function checkAdvanceToArchive(genealogyId: number) {
  return canAdvanceToArchive(genealogyId)
}
