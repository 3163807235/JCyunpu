import { isMockEnabled } from '@/mock/auth'
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
  if (isMockEnabled()) return mockListPersons(params)
  throw new Error('人物列表接口尚未对接后端')
}

export function fetchPersonDetail(id: number) {
  if (isMockEnabled()) return mockGetPerson(id)
  throw new Error('人物详情接口尚未对接后端')
}

export function fetchCreatePerson(
  genealogyId: number,
  params: Api.Person.FormParams,
  personLimit?: number
) {
  if (isMockEnabled()) return mockCreatePerson(genealogyId, params, personLimit)
  throw new Error('创建人物接口尚未对接后端')
}

export function fetchUpdatePerson(id: number, params: Partial<Api.Person.FormParams>) {
  if (isMockEnabled()) return mockUpdatePerson(id, params)
  throw new Error('更新人物接口尚未对接后端')
}

export function fetchSoftDeletePerson(id: number) {
  if (isMockEnabled()) return mockSoftDeletePerson(id)
  throw new Error('删除人物接口尚未对接后端')
}

export function fetchRestorePerson(id: number, personLimit?: number) {
  if (isMockEnabled()) return mockRestorePerson(id, personLimit)
  throw new Error('恢复人物接口尚未对接后端')
}

export function fetchPurgePerson(id: number) {
  if (isMockEnabled()) return mockPurgePerson(id)
  throw new Error('彻底删除人物接口尚未对接后端')
}

export function fetchImportPersons(
  genealogyId: number,
  rows: Api.Person.ImportRow[] | Api.Person.FormParams[],
  personLimit?: number
) {
  if (isMockEnabled()) return mockImportPersons(genealogyId, rows, personLimit)
  throw new Error('导入人物接口尚未对接后端')
}

export function fetchGenerationConfig(genealogyId: number) {
  if (isMockEnabled()) return mockGetGenerationConfig(genealogyId)
  throw new Error('字辈配置接口尚未对接后端')
}

export function fetchSaveGenerationConfig(
  genealogyId: number,
  config: Api.Genealogy.GenerationConfig
) {
  if (isMockEnabled()) return mockSaveGenerationConfig(genealogyId, config)
  throw new Error('保存字辈接口尚未对接后端')
}
