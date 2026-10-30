import { isMockEnabled } from '@/mock/auth'
import {
  mockGetSubscriptionSummary,
  mockListExpandPacks,
  mockListOrders,
  mockListPlans,
  mockListQuotaTransactions,
  mockPurchaseExpand,
  mockPurchasePlan,
  mockSetAutoRenew,
  mockSimulateSubscription
} from '@/mock/subscription'

/** 订阅中心 API（Mock 优先）· 产品文档 §3.4 页面 13 */

export function fetchSubscriptionSummary() {
  if (isMockEnabled()) return mockGetSubscriptionSummary()
  throw new Error('订阅摘要接口尚未对接后端')
}

export function fetchSubscriptionPlans() {
  if (isMockEnabled()) return mockListPlans()
  throw new Error('套餐列表接口尚未对接后端')
}

export function fetchExpandPacks() {
  if (isMockEnabled()) return mockListExpandPacks()
  throw new Error('扩容包接口尚未对接后端')
}

export function fetchQuotaTransactions(params?: Api.Subscription.QuotaListParams) {
  if (isMockEnabled()) return mockListQuotaTransactions(params)
  throw new Error('额度流水接口尚未对接后端')
}

export function fetchSubscriptionOrders(params?: Api.Subscription.OrderListParams) {
  if (isMockEnabled()) return mockListOrders(params)
  throw new Error('订单列表接口尚未对接后端')
}

export function fetchPurchasePlan(params: Api.Subscription.PurchasePlanParams) {
  if (isMockEnabled()) return mockPurchasePlan(params)
  throw new Error('套餐购买接口尚未对接后端')
}

export function fetchPurchaseExpand(params: Api.Subscription.PurchaseExpandParams) {
  if (isMockEnabled()) return mockPurchaseExpand(params)
  throw new Error('扩容包购买接口尚未对接后端')
}

export function fetchSetAutoRenew(autoRenew: boolean) {
  if (isMockEnabled()) return mockSetAutoRenew(autoRenew)
  throw new Error('自动续费接口尚未对接后端')
}

/** 仅 Mock：模拟过期 / 恢复试用 / 压满额度 */
export function fetchSimulateSubscription(scenario: Api.Subscription.SimulateScenario) {
  if (isMockEnabled()) return mockSimulateSubscription(scenario)
  throw new Error('模拟订阅仅 Mock 可用')
}
