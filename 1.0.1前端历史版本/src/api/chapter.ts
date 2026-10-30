import { isMockEnabled } from '@/mock/auth'
import {
  mockCreateChapter,
  mockDeleteChapter,
  mockListChapters,
  mockReorderChapters,
  mockUpdateChapter
} from '@/mock/chapter'

export function fetchChapterList(genealogyId: number) {
  if (isMockEnabled()) return mockListChapters(genealogyId)
  throw new Error('章节列表接口尚未对接后端')
}

export function fetchCreateChapter(genealogyId: number, params: Api.Chapter.FormParams) {
  if (isMockEnabled()) return mockCreateChapter(genealogyId, params)
  throw new Error('创建章节接口尚未对接后端')
}

export function fetchUpdateChapter(
  id: number,
  params: Partial<Api.Chapter.FormParams> & { sortOrder?: number }
) {
  if (isMockEnabled()) return mockUpdateChapter(id, params)
  throw new Error('更新章节接口尚未对接后端')
}

export function fetchDeleteChapter(id: number) {
  if (isMockEnabled()) return mockDeleteChapter(id)
  throw new Error('删除章节接口尚未对接后端')
}

export function fetchReorderChapters(genealogyId: number, orderedIds: number[]) {
  if (isMockEnabled()) return mockReorderChapters(genealogyId, orderedIds)
  throw new Error('章节排序接口尚未对接后端')
}
