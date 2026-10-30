import { isMockEnabled } from '@/mock/auth'
import {
  mockCreateShareLink,
  mockGetSharePublicView,
  mockListShareLinks,
  mockRevokeShareLink
} from '@/mock/share'

export function fetchShareLinkList(genealogyId: number) {
  if (isMockEnabled()) return mockListShareLinks(genealogyId)
  throw new Error('分享链接列表接口尚未对接后端')
}

export function fetchCreateShareLink(params: Api.ShareLink.CreateParams, userId: number) {
  if (isMockEnabled()) return mockCreateShareLink(params, userId)
  throw new Error('生成分享链接接口尚未对接后端')
}

export function fetchRevokeShareLink(id: number, userId: number) {
  if (isMockEnabled()) return mockRevokeShareLink(id, userId)
  throw new Error('撤销分享链接接口尚未对接后端')
}

export function fetchSharePublicView(token: string) {
  if (isMockEnabled()) return mockGetSharePublicView(token)
  throw new Error('分享浏览接口尚未对接后端')
}
