import request from '@/utils/http'
import { isSubscriptionMockEnabled } from '@/mock/auth'
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

/** 订阅中心 API · 产品文档 §3.4 页面 13；OpenAPI §10；分开关 VITE_USE_SUBSCRIPTION_MOCK */

export function fetchSubscriptionSummary() {
  if (isSubscriptionMockEnabled()) return mockGetSubscriptionSummary()
  return request.get<Api.Subscription.Summary>({
    url: '/api/subscription/summary'
  })
}

export function fetchSubscriptionPlans() {
  if (isSubscriptionMockEnabled()) return mockListPlans()
  return request.get<Api.Subscription.PlanOption[]>({
    url: '/api/subscription/plans'
  })
}

export function fetchExpandPacks() {
  if (isSubscriptionMockEnabled()) return mockListExpandPacks()
  return request.get<Api.Subscription.ExpandPack[]>({
    url: '/api/subscription/expand-packs'
  })
}

export function fetchQuotaTransactions(params?: Api.Subscription.QuotaListParams) {
  if (isSubscriptionMockEnabled()) return mockListQuotaTransactions(params)
  return request.get<Api.Common.PaginatedResponse<Api.Subscription.QuotaTransactionItem>>({
    url: '/api/quota/transactions',
    params
  })
}

export function fetchSubscriptionOrders(params?: Api.Subscription.OrderListParams) {
  if (isSubscriptionMockEnabled()) return mockListOrders(params)
  return request.get<Api.Common.PaginatedResponse<Api.Subscription.OrderItem>>({
    url: '/api/orders',
    params
  })
}

export function fetchPurchasePlan(params: Api.Subscription.PurchasePlanParams) {
  if (isSubscriptionMockEnabled()) return mockPurchasePlan(params)
  return request.post<Api.Subscription.OrderItem>({
    url: '/api/orders',
    params: {
      planType: params.planType,
      paymentMethod: params.paymentMethod,
      autoRenew: params.autoRenew
    }
  })
}

export function fetchPurchaseExpand(params: Api.Subscription.PurchaseExpandParams) {
  if (isSubscriptionMockEnabled()) return mockPurchaseExpand(params)
  return request.post<Api.Subscription.OrderItem>({
    url: '/api/orders',
    params: {
      packId: params.packId,
      paymentMethod: params.paymentMethod
    }
  })
}

export function fetchSetAutoRenew(autoRenew: boolean) {
  if (isSubscriptionMockEnabled()) return mockSetAutoRenew(autoRenew)
  return request.post<Api.Subscription.Summary>({
    url: '/api/subscription/auto-renew',
    params: { autoRenew }
  })
}

/** 仅 Mock：模拟过期 / 恢复试用 / 压满额度 */
export function fetchSimulateSubscription(scenario: Api.Subscription.SimulateScenario) {
  if (isSubscriptionMockEnabled()) return mockSimulateSubscription(scenario)
  throw new Error('模拟订阅仅 Mock 可用')
}
