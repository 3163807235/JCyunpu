import request from '@/utils/http'
import { isCollaboratorMockEnabled } from '@/mock/auth'
import {
  mockAcceptCollaborator,
  mockAcceptMyCollaboratorInvite,
  mockInviteCollaborator,
  mockListCollaborators,
  mockListMyCollaboratorInvites,
  mockRejectMyCollaboratorInvite,
  mockRemoveCollaborator
} from '@/mock/collaborator'

/** 协作 L2 · OpenAPI §4 / 产品 §1.7.16；分开关 VITE_USE_COLLABORATOR_MOCK */

export function fetchCollaboratorList(
  genealogyId: number,
  owner: { userId: number; displayName: string; phone: string }
) {
  if (isCollaboratorMockEnabled()) {
    return mockListCollaborators(genealogyId, owner)
  }
  return request.get<Api.Collaborator.ListResult>({
    url: `/api/genealogy/${genealogyId}/collaborators`
  })
}

export function fetchInviteCollaborator(
  genealogyId: number,
  params: Api.Collaborator.InviteParams,
  _invitedBy: number
) {
  if (isCollaboratorMockEnabled()) {
    return mockInviteCollaborator(genealogyId, params, _invitedBy)
  }
  return request.post<Api.Collaborator.Item>({
    url: `/api/genealogy/${genealogyId}/collaborators`,
    params: {
      phone: params.phone,
      displayName: params.displayName,
      role: params.role || 'editor'
    }
  })
}

/** @deprecated 请用 fetchAcceptMyCollaboratorInvite；仅兼容旧 Mock 路径 */
export function fetchAcceptCollaborator(genealogyId: number, id: number) {
  if (isCollaboratorMockEnabled()) {
    return mockAcceptCollaborator(genealogyId, id)
  }
  return request.post<Api.Collaborator.Item>({
    url: `/api/user/collaborator-invites/${id}/accept`
  })
}

/** 被邀请人：我的待接受协作邀请 */
export function fetchMyCollaboratorInvites() {
  if (isCollaboratorMockEnabled()) {
    return mockListMyCollaboratorInvites()
  }
  return request.get<Api.Collaborator.MyInviteItem[]>({
    url: '/api/user/collaborator-invites'
  })
}

export function fetchAcceptMyCollaboratorInvite(id: number) {
  if (isCollaboratorMockEnabled()) {
    return mockAcceptMyCollaboratorInvite(id)
  }
  return request.post<Api.Collaborator.Item>({
    url: `/api/user/collaborator-invites/${id}/accept`
  })
}

export function fetchRejectMyCollaboratorInvite(id: number) {
  if (isCollaboratorMockEnabled()) {
    return mockRejectMyCollaboratorInvite(id)
  }
  return request.post<void>({
    url: `/api/user/collaborator-invites/${id}/reject`
  })
}

/** 移除：后端按 userId（OpenAPI）；Mock 仍按记录 id */
export function fetchRemoveCollaborator(
  genealogyId: number,
  idOrUserId: number,
  userId?: number
) {
  if (isCollaboratorMockEnabled()) {
    return mockRemoveCollaborator(genealogyId, idOrUserId)
  }
  const uid = userId ?? idOrUserId
  return request.del<void>({
    url: `/api/genealogy/${genealogyId}/collaborators/${uid}`
  })
}
