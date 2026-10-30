import { isMockEnabled } from '@/mock/auth'
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
 * 族谱 API（Mock 优先；真后端就绪后切换）
 */

export function fetchGenealogyList(params?: Api.Genealogy.ListParams) {
  if (isMockEnabled()) {
    return mockListGenealogies(params)
  }
  throw new Error('族谱列表接口尚未对接后端')
}

export function fetchGenealogyDetail(id: number) {
  if (isMockEnabled()) {
    return mockGetGenealogy(id)
  }
  throw new Error('族谱详情接口尚未对接后端')
}

export function fetchCreateGenealogy(params: Api.Genealogy.CreateParams) {
  if (isMockEnabled()) {
    return mockCreateGenealogy(params)
  }
  throw new Error('创建族谱接口尚未对接后端')
}

export function fetchUpdateGenealogy(id: number, params: Api.Genealogy.UpdateParams) {
  if (isMockEnabled()) {
    return mockUpdateGenealogy(id, params)
  }
  throw new Error('更新族谱接口尚未对接后端')
}

export function fetchSoftDeleteGenealogy(id: number) {
  if (isMockEnabled()) {
    return mockSoftDeleteGenealogy(id)
  }
  throw new Error('删除族谱接口尚未对接后端')
}

export function fetchRestoreGenealogy(id: number) {
  if (isMockEnabled()) {
    return mockRestoreGenealogy(id)
  }
  throw new Error('恢复族谱接口尚未对接后端')
}

export function fetchPurgeGenealogy(id: number, smsCode: string) {
  if (isMockEnabled()) {
    return mockPurgeGenealogy(id, smsCode)
  }
  throw new Error('彻底删除接口尚未对接后端')
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
