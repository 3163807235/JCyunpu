import { isMockEnabled } from '@/mock/auth'
import {
  mockOpsAuditList,
  mockOpsDashboard,
  mockOpsFreezeUser,
  mockOpsOrderList,
  mockOpsUnfreezeUser,
  mockOpsUserList,
  type OpsAccountStatus,
  type OpsAuditItem,
  type OpsDashboardStats,
  type OpsUserItem
} from '@/mock/ops'

export type { OpsAccountStatus, OpsAuditItem, OpsDashboardStats, OpsUserItem }

export function fetchOpsDashboard() {
  if (isMockEnabled()) return mockOpsDashboard()
  throw new Error('运营工作台接口尚未对接后端')
}

export function fetchOpsUserList(params: {
  current?: number
  size?: number
  keyword?: string
  status?: OpsAccountStatus | ''
  planType?: string
}) {
  if (isMockEnabled()) return mockOpsUserList(params)
  throw new Error('运营用户列表接口尚未对接后端')
}

export function fetchOpsFreezeUser(id: number, reason: string, adminName: string) {
  if (isMockEnabled()) return mockOpsFreezeUser(id, reason, adminName)
  throw new Error('冻结用户接口尚未对接后端')
}

export function fetchOpsUnfreezeUser(id: number, adminName: string) {
  if (isMockEnabled()) return mockOpsUnfreezeUser(id, adminName)
  throw new Error('解冻用户接口尚未对接后端')
}

export function fetchOpsOrderList(params?: Api.Subscription.OrderListParams) {
  if (isMockEnabled()) return mockOpsOrderList(params)
  throw new Error('运营订单列表接口尚未对接后端')
}

export function fetchOpsAuditList(params: {
  current?: number
  size?: number
  keyword?: string
  action?: string
}) {
  if (isMockEnabled()) return mockOpsAuditList(params)
  throw new Error('审计日志接口尚未对接后端')
}
