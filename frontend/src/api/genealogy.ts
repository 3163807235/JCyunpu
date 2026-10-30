import request from '@/utils/http'
import { isGenealogyMockEnabled, isMockEnabled } from '@/mock/auth'
import {
  mockCreateGenealogy,
  mockGetGenealogy,
  mockGetProject,
  mockIsProjectInitialized,
  mockListGenealogies,
  mockPurgeGenealogy,
  mockRestoreGenealogy,
  mockSaveProject,
  mockSoftDeleteGenealogy,
  mockUpdateGenealogy,
  mockUpdateStage
} from '@/mock/genealogy'

/**
 * 族谱 API（分开关：VITE_USE_GENEALOGY_MOCK；项目相关仍跟随全局 Mock）
 */

export function fetchGenealogyList(params?: Api.Genealogy.ListParams) {
  if (isGenealogyMockEnabled()) {
    return mockListGenealogies(params)
  }
  return request.get<Api.Common.PaginatedResponse<Api.Genealogy.Item>>({
    url: '/api/genealogy/list',
    params
  })
}

export function fetchGenealogyDetail(id: number) {
  if (isGenealogyMockEnabled()) {
    return mockGetGenealogy(id)
  }
  return request.get<Api.Genealogy.Item>({
    url: `/api/genealogy/${id}`
  })
}

export function fetchCreateGenealogy(params: Api.Genealogy.CreateParams) {
  if (isGenealogyMockEnabled()) {
    return mockCreateGenealogy(params)
  }
  return request.post<Api.Genealogy.Item>({
    url: '/api/genealogy',
    params
  })
}

export function fetchUpdateGenealogy(id: number, params: Api.Genealogy.UpdateParams) {
  if (isGenealogyMockEnabled()) {
    return mockUpdateGenealogy(id, params)
  }
  return request.put<Api.Genealogy.Item>({
    url: `/api/genealogy/${id}`,
    params
  })
}

export function fetchSoftDeleteGenealogy(id: number) {
  if (isGenealogyMockEnabled()) {
    return mockSoftDeleteGenealogy(id)
  }
  return request.post<void>({
    url: `/api/genealogy/${id}/trash`
  })
}

export function fetchRestoreGenealogy(id: number) {
  if (isGenealogyMockEnabled()) {
    return mockRestoreGenealogy(id)
  }
  return request.post<Api.Genealogy.Item>({
    url: `/api/genealogy/${id}/restore`
  })
}

export function fetchPurgeGenealogy(id: number, smsCode: string) {
  if (isGenealogyMockEnabled()) {
    return mockPurgeGenealogy(id, smsCode)
  }
  // 后端 P0：拥有者鉴权即可彻底删除；smsCode 留给二次确认产品增强
  return request.del<void>({
    url: `/api/genealogy/${id}`,
    params: smsCode ? { smsCode } : undefined
  })
}

export function fetchUpdateGenealogyStage(id: number, stage: Api.Genealogy.Stage) {
  if (isMockEnabled()) {
    return mockUpdateStage(id, stage)
  }
  throw new Error('更新阶段接口尚未对接后端')
}

export function fetchGenealogyProject(id: number) {
  if (isMockEnabled()) {
    return mockGetProject(id)
  }
  throw new Error('项目信息接口尚未对接后端')
}

/** 是否已在项目启动页显式创建（推进内容编排前校验） */
export function fetchIsProjectInitialized(id: number) {
  if (isMockEnabled()) {
    return Promise.resolve(mockIsProjectInitialized(id))
  }
  throw new Error('校验修谱项目接口尚未对接后端')
}

export function fetchSaveGenealogyProject(id: number, data: Api.Genealogy.ProjectInfo) {
  if (isMockEnabled()) {
    return mockSaveProject(id, data)
  }
  throw new Error('保存项目接口尚未对接后端')
}

/** @deprecated 请使用 @/api/subscription；保留兼容旧引用 */
export { fetchSubscriptionSummary } from './subscription'
