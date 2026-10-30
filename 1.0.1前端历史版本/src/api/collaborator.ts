import { isMockEnabled } from '@/mock/auth'
import {
  mockAcceptCollaborator,
  mockInviteCollaborator,
  mockListCollaborators,
  mockRemoveCollaborator
} from '@/mock/collaborator'

export function fetchCollaboratorList(
  genealogyId: number,
  owner: { userId: number; displayName: string; phone: string }
) {
  if (isMockEnabled()) {
    return mockListCollaborators(genealogyId, owner)
  }
  throw new Error('协作成员列表接口尚未对接后端')
}

export function fetchInviteCollaborator(
  genealogyId: number,
  params: Api.Collaborator.InviteParams,
  invitedBy: number
) {
  if (isMockEnabled()) {
    return mockInviteCollaborator(genealogyId, params, invitedBy)
  }
  throw new Error('邀请协作成员接口尚未对接后端')
}

export function fetchAcceptCollaborator(genealogyId: number, id: number) {
  if (isMockEnabled()) {
    return mockAcceptCollaborator(genealogyId, id)
  }
  throw new Error('接受协作邀请接口尚未对接后端')
}

export function fetchRemoveCollaborator(genealogyId: number, id: number) {
  if (isMockEnabled()) {
    return mockRemoveCollaborator(genealogyId, id)
  }
  throw new Error('移除协作成员接口尚未对接后端')
}
