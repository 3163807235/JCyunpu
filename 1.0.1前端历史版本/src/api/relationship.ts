import { isMockEnabled } from '@/mock/auth'
import {
  mockCreateRelation,
  mockDeleteRelation,
  mockListRelations,
  mockSetFather
} from '@/mock/relationship'

export function fetchRelationList(genealogyId: number) {
  if (isMockEnabled()) return mockListRelations(genealogyId)
  throw new Error('关系列表接口尚未对接后端')
}

export function fetchCreateRelation(params: Api.Relationship.CreateParams) {
  if (isMockEnabled()) return mockCreateRelation(params)
  throw new Error('创建关系接口尚未对接后端')
}

export function fetchDeleteRelation(id: number) {
  if (isMockEnabled()) return mockDeleteRelation(id)
  throw new Error('删除关系接口尚未对接后端')
}

export function fetchSetFather(genealogyId: number, childId: number, fatherId: number, remark?: string) {
  if (isMockEnabled()) return mockSetFather(genealogyId, childId, fatherId, remark)
  throw new Error('更改父节点接口尚未对接后端')
}
