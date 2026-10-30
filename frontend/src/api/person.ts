import request from '@/utils/http'
import { isMockEnabled, isPersonMockEnabled } from '@/mock/auth'
import {
  mockCreatePerson,
  mockGetGenerationConfig,
  mockGetPerson,
  mockImportPersons,
  mockListPersons,
  mockPurgePerson,
  mockRestorePerson,
  mockSaveGenerationConfig,
  mockSoftDeletePerson,
  mockUpdatePerson
} from '@/mock/person'

export function fetchPersonList(params: Api.Person.ListParams) {
  if (isPersonMockEnabled()) return mockListPersons(params)
  return request.get<Api.Common.PaginatedResponse<Api.Person.Item>>({
    url: `/api/genealogy/${params.genealogyId}/persons`,
    params: {
      current: params.current,
      size: params.size,
      keyword: params.keyword,
      generation: params.generation,
      gender: params.gender,
      isAlive: params.isAlive,
      scope: params.scope,
      lineageScope: params.lineageScope
    }
  })
}

export function fetchPersonDetail(id: number) {
  if (isPersonMockEnabled()) return mockGetPerson(id)
  return request.get<Api.Person.Item>({
    url: `/api/persons/${id}`
  })
}

export function fetchCreatePerson(
  genealogyId: number,
  params: Api.Person.FormParams,
  _personLimit?: number
) {
  if (isPersonMockEnabled()) return mockCreatePerson(genealogyId, params, _personLimit)
  return request.post<Api.Person.Item>({
    url: `/api/genealogy/${genealogyId}/persons`,
    params
  })
}

export function fetchUpdatePerson(id: number, params: Partial<Api.Person.FormParams>) {
  if (isPersonMockEnabled()) return mockUpdatePerson(id, params)
  return request.put<Api.Person.Item>({
    url: `/api/persons/${id}`,
    params
  })
}

export function fetchSoftDeletePerson(id: number) {
  if (isPersonMockEnabled()) return mockSoftDeletePerson(id)
  return request.del<void>({
    url: `/api/persons/${id}`
  })
}

export function fetchRestorePerson(id: number, personLimit?: number) {
  if (isPersonMockEnabled()) return mockRestorePerson(id, personLimit)
  return request.post<Api.Person.Item>({
    url: `/api/persons/${id}/restore`
  })
}

export function fetchPurgePerson(id: number) {
  if (isPersonMockEnabled()) return mockPurgePerson(id)
  return request.del<void>({
    url: `/api/persons/${id}/purge`
  })
}

export function fetchImportPersons(
  genealogyId: number,
  rows: Api.Person.ImportRow[] | Api.Person.FormParams[],
  personLimit?: number
) {
  // 批量导入仍为 P1，暂走 Mock
  if (isMockEnabled()) return mockImportPersons(genealogyId, rows, personLimit)
  throw new Error('导入人物接口尚未对接后端')
}

export function fetchGenerationConfig(genealogyId: number) {
  if (isPersonMockEnabled()) return mockGetGenerationConfig(genealogyId)
  return request.get<Api.Genealogy.GenerationConfig>({
    url: `/api/genealogy/${genealogyId}/generation-config`
  })
}

export function fetchSaveGenerationConfig(
  genealogyId: number,
  config: Api.Genealogy.GenerationConfig
) {
  if (isPersonMockEnabled()) return mockSaveGenerationConfig(genealogyId, config)
  return request.put<Api.Genealogy.GenerationConfig>({
    url: `/api/genealogy/${genealogyId}/generation-config`,
    params: config
  })
}
