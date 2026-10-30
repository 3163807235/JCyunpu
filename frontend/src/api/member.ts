import request from '@/utils/http'
import { isMemberMockEnabled } from '@/mock/auth'
import {
  mockGetInviteCode,
  mockJoinByInviteCode,
  mockLeaveMember,
  mockListMembers,
  mockPreviewInviteCode,
  mockRemoveMember,
  mockRotateInviteCode
} from '@/mock/member'

/** 族谱成员 / 邀请码 · 专题 v0.1 · OpenAPI §3 */

export function fetchPreviewInviteCode(code: string) {
  if (isMemberMockEnabled()) return mockPreviewInviteCode(code)
  return request.get<Api.GenealogyMember.InvitePreview>({
    url: '/api/genealogy/invite-codes/preview',
    params: { code }
  })
}

export function fetchJoinGenealogyByCode(params: Api.GenealogyMember.JoinParams) {
  if (isMemberMockEnabled()) return mockJoinByInviteCode(params.code)
  return request.post<void>({
    url: '/api/genealogy/members/join',
    params
  })
}

export function fetchGenealogyInviteCode(genealogyId: number) {
  if (isMemberMockEnabled()) return mockGetInviteCode(genealogyId)
  return request.get<Api.GenealogyMember.InviteCode>({
    url: `/api/genealogy/${genealogyId}/invite-code`
  })
}

export function fetchRotateGenealogyInviteCode(genealogyId: number) {
  if (isMemberMockEnabled()) return mockRotateInviteCode(genealogyId)
  return request.post<Api.GenealogyMember.InviteCode>({
    url: `/api/genealogy/${genealogyId}/invite-code/rotate`
  })
}

export function fetchGenealogyMembers(genealogyId: number) {
  if (isMemberMockEnabled()) return mockListMembers(genealogyId)
  return request.get<Api.GenealogyMember.Item[]>({
    url: `/api/genealogy/${genealogyId}/members`
  })
}

export function fetchRemoveGenealogyMember(genealogyId: number, userId: number) {
  if (isMemberMockEnabled()) return mockRemoveMember(genealogyId, userId)
  return request.del<void>({
    url: `/api/genealogy/${genealogyId}/members/${userId}`
  })
}

export function fetchLeaveGenealogyMember(genealogyId: number) {
  if (isMemberMockEnabled()) return mockLeaveMember(genealogyId)
  return request.post<void>({
    url: `/api/genealogy/${genealogyId}/members/leave`
  })
}
