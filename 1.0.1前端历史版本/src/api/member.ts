import { isMockEnabled } from '@/mock/auth'
import {
  mockGetInviteCode,
  mockJoinByInviteCode,
  mockLeaveMember,
  mockListMembers,
  mockPreviewInviteCode,
  mockRemoveMember,
  mockRotateInviteCode
} from '@/mock/member'

/** 族谱成员 / 邀请码 · 专题 v0.1 */

export function fetchPreviewInviteCode(code: string) {
  if (isMockEnabled()) return mockPreviewInviteCode(code)
  throw new Error('邀请码预览接口尚未对接后端')
}

export function fetchJoinGenealogyByCode(params: Api.GenealogyMember.JoinParams) {
  if (isMockEnabled()) return mockJoinByInviteCode(params.code)
  throw new Error('加入族谱接口尚未对接后端')
}

export function fetchGenealogyInviteCode(genealogyId: number) {
  if (isMockEnabled()) return mockGetInviteCode(genealogyId)
  throw new Error('成员邀请码接口尚未对接后端')
}

export function fetchRotateGenealogyInviteCode(genealogyId: number) {
  if (isMockEnabled()) return mockRotateInviteCode(genealogyId)
  throw new Error('重置成员邀请码接口尚未对接后端')
}

export function fetchGenealogyMembers(genealogyId: number) {
  if (isMockEnabled()) return mockListMembers(genealogyId)
  throw new Error('族谱成员列表接口尚未对接后端')
}

export function fetchRemoveGenealogyMember(genealogyId: number, userId: number) {
  if (isMockEnabled()) return mockRemoveMember(genealogyId, userId)
  throw new Error('移除族谱成员接口尚未对接后端')
}

export function fetchLeaveGenealogyMember(genealogyId: number) {
  if (isMockEnabled()) return mockLeaveMember(genealogyId)
  throw new Error('退出族谱接口尚未对接后端')
}
