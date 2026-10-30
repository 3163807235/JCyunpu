import { isMockEnabled } from '@/mock/auth'
import {
  mockGetOperationLog,
  mockListOperationLogOperators,
  mockListOperationLogs
} from '@/mock/operation-log'

export function fetchOperationLogList(params: Api.OperationLog.ListParams) {
  if (isMockEnabled()) {
    return mockListOperationLogs(params)
  }
  throw new Error('操作日志列表接口尚未对接后端')
}

export function fetchOperationLogOperators(genealogyId: number) {
  if (isMockEnabled()) {
    return mockListOperationLogOperators(genealogyId)
  }
  throw new Error('操作日志操作人接口尚未对接后端')
}

export function fetchOperationLogDetail(genealogyId: number, id: number) {
  if (isMockEnabled()) {
    return mockGetOperationLog(genealogyId, id)
  }
  throw new Error('操作日志详情接口尚未对接后端')
}
