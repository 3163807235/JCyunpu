import request from '@/utils/http'
import { isRelationshipMockEnabled } from '@/mock/auth'
import {
  mockCreateRelation,
  mockDeleteRelation,
  mockListRelations,
  mockSetFather
} from '@/mock/relationship'

export function fetchRelationList(genealogyId: number) {
  if (isRelationshipMockEnabled()) return mockListRelations(genealogyId)
  return request.get<Api.Relationship.Item[]>({
    url: `/api/genealogy/${genealogyId}/relationships`
  })
}

export function fetchCreateRelation(params: Api.Relationship.CreateParams) {
  if (isRelationshipMockEnabled()) return mockCreateRelation(params)
  return request.post<Api.Relationship.Item[]>({
    url: `/api/genealogy/${params.genealogyId}/relationships`,
    params
  })
}

export function fetchDeleteRelation(id: number) {
  if (isRelationshipMockEnabled()) return mockDeleteRelation(id)
  return request.del<void>({
    url: `/api/relationships/${id}`
  })
}

export function fetchSetFather(
  genealogyId: number,
  childId: number,
  fatherId: number,
  remark?: string
) {
  if (isRelationshipMockEnabled()) return mockSetFather(genealogyId, childId, fatherId, remark)
  return request.post<Api.Relationship.Item[]>({
    url: `/api/genealogy/${genealogyId}/relationships/set-father`,
    params: { childId, fatherId, remark }
  })
}
