/**
 * 订阅 / 订单 / 额度流水 Mock（localStorage）
 * 依据：产品设计文档 v3.1.6 §0.8 / §1.7.11–13 / §3.4 页面 13
 */

import { countPersonQuotaUsed } from './person'

const STORAGE_KEY = 'jcyunpu_mock_subscription_v1'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

/** 套餐权益（§0.8）；MVP 族谱数仍硬限 1 */
export const PLAN_CATALOG: Api.Subscription.PlanOption[] = [
  {
    planType: 'trial',
    name: '试用套餐',
    price: 0,
    durationDays: 30,
    personQuota: 50,
    storageQuotaMb: 100,
    maxCollaborators: 1,
    maxContinuationCount: 0,
    maxGenealogyCount: 1,
    allowPdfExport: false,
    allowBatchExport: false,
    ocrMonthly: 5,
    features: ['30 天试用', '50 人 / 100MB', '牒记式预览（含水印）', '不可批量导入']
  },
  {
    planType: 'basic',
    name: '基础年付',
    price: 299,
    durationDays: 365,
    personQuota: 500,
    storageQuotaMb: 2048,
    maxCollaborators: 5,
    maxContinuationCount: 3,
    maxGenealogyCount: 1,
    allowPdfExport: true,
    allowBatchExport: true,
    ocrMonthly: 50,
    features: ['500 人 / 2GB', '印刷版 PDF', 'Excel 批量导入', '续修 3 次', '可购扩容包']
  },
  {
    planType: 'professional',
    name: '专业年付',
    price: 899,
    durationDays: 365,
    personQuota: 3000,
    storageQuotaMb: 10240,
    maxCollaborators: 20,
    maxContinuationCount: -1,
    maxGenealogyCount: 1,
    allowPdfExport: true,
    allowBatchExport: true,
    ocrMonthly: -1,
    features: ['3000 人 / 10GB', '印刷版 PDF + 批量导出', '续修无限', '可购扩容包', '1对1 客服']
  }
]

export const EXPAND_PACKS: Api.Subscription.ExpandPack[] = [
  {
    id: 'person_100',
    productType: 'person_expand',
    name: '人物扩容包 100 人',
    amount: 49,
    personAdd: 100,
    storageAddMb: 0
  },
  {
    id: 'person_500',
    productType: 'person_expand',
    name: '人物扩容包 500 人',
    amount: 199,
    personAdd: 500,
    storageAddMb: 0
  },
  {
    id: 'person_1000',
    productType: 'person_expand',
    name: '人物扩容包 1000 人',
    amount: 349,
    personAdd: 1000,
    storageAddMb: 0
  },
  {
    id: 'storage_1g',
    productType: 'storage_expand',
    name: '存储扩容包 1GB',
    amount: 29,
    personAdd: 0,
    storageAddMb: 1024
  },
  {
    id: 'storage_5g',
    productType: 'storage_expand',
    name: '存储扩容包 5GB',
    amount: 99,
    personAdd: 0,
    storageAddMb: 5120
  },
  {
    id: 'storage_10g',
    productType: 'storage_expand',
    name: '存储扩容包 10GB',
    amount: 169,
    personAdd: 0,
    storageAddMb: 10240
  }
]

interface PersistedState {
  planType: Api.Subscription.PlanType
  /** 1=生效中 2=已过期 3=已取消；过期亦可由 expireDate 推导 */
  statusCode: 1 | 2 | 3
  startDate: string
  expireDate: string
  autoRenew: boolean
  personQuota: number
  storageQuotaMb: number
  storageUsedMb: number
  maxCollaborators: number
  maxContinuationCount: number
  maxGenealogyCount: number
  continuationUsed: number
  ocrRemaining: number
  allowPdfExport: boolean
  allowBatchExport: boolean
  orders: Api.Subscription.OrderItem[]
  transactions: Api.Subscription.QuotaTransactionItem[]
}

function defaultState(): PersistedState {
  const start = nowIso()
  return {
    planType: 'trial',
    statusCode: 1,
    startDate: start,
    expireDate: addDays(new Date(), 30),
    autoRenew: false,
    personQuota: 50,
    storageQuotaMb: 100,
    storageUsedMb: 0,
    maxCollaborators: 1,
    maxContinuationCount: 0,
    maxGenealogyCount: 1,
    continuationUsed: 0,
    ocrRemaining: 5,
    allowPdfExport: false,
    allowBatchExport: false,
    orders: [],
    transactions: [
      {
        id: 1,
        quotaType: 'person',
        changeType: 'gift',
        changeAmount: 50,
        balanceAfter: 50,
        operatorName: '系统',
        remark: '试用套餐赠送人物额度',
        createdAt: start
      },
      {
        id: 2,
        quotaType: 'storage',
        changeType: 'gift',
        changeAmount: 100,
        balanceAfter: 100,
        operatorName: '系统',
        remark: '试用套餐赠送存储额度',
        createdAt: start
      }
    ]
  }
}

function readState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const init = defaultState()
      writeState(init)
      return init
    }
    return { ...defaultState(), ...(JSON.parse(raw) as PersistedState) }
  } catch {
    return defaultState()
  }
}

function writeState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function planName(planType: Api.Subscription.PlanType) {
  return PLAN_CATALOG.find((p) => p.planType === planType)?.name || planType
}

function resolveStatus(state: PersistedState): Api.Subscription.Status {
  if (state.statusCode === 2 || state.statusCode === 3) return 'expired'
  if (state.expireDate && new Date(state.expireDate).getTime() < Date.now()) return 'expired'
  if (state.planType === 'trial') return 'trial'
  return 'active'
}

function nextOrderNo(orders: Api.Subscription.OrderItem[]) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `GC${day}${String(orders.length + 1).padStart(4, '0')}`
}

function nextTxId(list: Api.Subscription.QuotaTransactionItem[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function nextOrderId(list: Api.Subscription.OrderItem[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function toSummary(state: PersistedState): Api.Subscription.Summary {
  const status = resolveStatus(state)
  const personUsed = countPersonQuotaUsed()
  return {
    status,
    planType: state.planType,
    planName: planName(state.planType),
    startAt: state.startDate,
    expireAt: state.expireDate,
    autoRenew: state.autoRenew,
    personUsed,
    personLimit: state.personQuota,
    storageUsedMb: state.storageUsedMb,
    storageLimitMb: state.storageQuotaMb,
    maxGenealogyCount: state.maxGenealogyCount,
    maxCollaborators: state.maxCollaborators,
    maxContinuationCount: state.maxContinuationCount,
    continuationUsed: state.continuationUsed,
    ocrRemaining: state.ocrRemaining,
    allowPdfExport: status === 'expired' ? false : state.allowPdfExport,
    allowBatchExport: status === 'expired' ? false : state.allowBatchExport
  }
}

/** 同步读取摘要（供其它 Mock 拦截） */
export function getSubscriptionSummarySync(): Api.Subscription.Summary {
  return toSummary(readState())
}

/** 订阅过期：全只读（§0.8） */
export function assertSubscriptionWritable(action = '写操作') {
  const summary = getSubscriptionSummarySync()
  if (summary.status === 'expired') {
    throw new Error(`订阅已过期，禁止${action}。请续费后恢复。`)
  }
}

/** 额度用尽：禁止新增（§0.8） */
export function assertPersonQuotaAvailable(extra = 1) {
  const summary = getSubscriptionSummarySync()
  if (summary.personUsed + extra > summary.personLimit) {
    throw new Error('人物额度已用尽，请扩容或清理回收站后再新增')
  }
}

/** 高阶导出/锁定：过期或额度用尽均禁止（§0.4） */
export function assertPremiumExportAllowed() {
  const summary = getSubscriptionSummarySync()
  if (summary.status === 'expired') {
    throw new Error('订阅已过期，禁止排版定稿与 PDF 导出，请续费')
  }
  if (summary.personUsed >= summary.personLimit) {
    throw new Error('人物额度已用尽，禁止排版定稿与 PDF 导出，请扩容')
  }
  if (!summary.allowPdfExport) {
    throw new Error('当前套餐仅支持预览，升级基础/专业套餐后可导出印刷版 PDF')
  }
}

export async function mockGetSubscriptionSummary(): Promise<Api.Subscription.Summary> {
  await delay()
  return getSubscriptionSummarySync()
}

export async function mockListPlans(): Promise<Api.Subscription.PlanOption[]> {
  await delay()
  return PLAN_CATALOG
}

export async function mockListExpandPacks(): Promise<Api.Subscription.ExpandPack[]> {
  await delay()
  const summary = getSubscriptionSummarySync()
  // 试用不可购扩容包（§0.8）
  if (summary.planType === 'trial' || summary.status === 'expired') return []
  return EXPAND_PACKS
}

export async function mockListQuotaTransactions(
  params: Api.Subscription.QuotaListParams = {}
): Promise<Api.Common.PaginatedResponse<Api.Subscription.QuotaTransactionItem>> {
  await delay()
  const state = readState()
  let list = [...state.transactions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  if (params.quotaType) list = list.filter((t) => t.quotaType === params.quotaType)
  if (params.changeType) list = list.filter((t) => t.changeType === params.changeType)
  const current = params.current || 1
  const size = params.size || 10
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    current,
    size,
    total: list.length
  }
}

export async function mockListOrders(
  params: Api.Subscription.OrderListParams = {}
): Promise<Api.Common.PaginatedResponse<Api.Subscription.OrderItem>> {
  await delay()
  const state = readState()
  let list = [...state.orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  if (params.paymentStatus !== undefined && params.paymentStatus !== null) {
    list = list.filter((o) => o.paymentStatus === params.paymentStatus)
  }
  const current = params.current || 1
  const size = params.size || 10
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    current,
    size,
    total: list.length
  }
}

function applyPlanToState(
  state: PersistedState,
  plan: Api.Subscription.PlanOption,
  productType: Api.Subscription.ProductType
) {
  const start = nowIso()
  state.planType = plan.planType
  state.statusCode = 1
  state.startDate = start
  state.expireDate = addDays(new Date(), plan.durationDays)
  state.personQuota = plan.personQuota
  state.storageQuotaMb = plan.storageQuotaMb
  state.maxCollaborators = plan.maxCollaborators
  state.maxContinuationCount = plan.maxContinuationCount
  state.maxGenealogyCount = plan.maxGenealogyCount
  state.allowPdfExport = plan.allowPdfExport
  state.allowBatchExport = plan.allowBatchExport
  state.ocrRemaining = plan.ocrMonthly < 0 ? 9999 : plan.ocrMonthly
  state.continuationUsed = 0

  const personRemain = Math.max(0, state.personQuota - countPersonQuotaUsed())
  state.transactions.unshift({
    id: nextTxId(state.transactions),
    quotaType: 'person',
    changeType: productType === 'renewal' ? 'purchase' : 'purchase',
    changeAmount: plan.personQuota,
    balanceAfter: personRemain,
    operatorName: '当前用户',
    remark: `${plan.name}${productType === 'renewal' ? '续费' : '开通'}，额度重置为套餐上限`,
    createdAt: start
  })
  state.transactions.unshift({
    id: nextTxId(state.transactions),
    quotaType: 'storage',
    changeType: 'purchase',
    changeAmount: plan.storageQuotaMb,
    balanceAfter: Math.max(0, plan.storageQuotaMb - state.storageUsedMb),
    operatorName: '当前用户',
    remark: `${plan.name}存储额度生效`,
    createdAt: start
  })
}

/** Mock 购买/续费套餐（即时支付成功） */
export async function mockPurchasePlan(
  params: Api.Subscription.PurchasePlanParams
): Promise<Api.Subscription.OrderItem> {
  await delay(400)

  const plan = PLAN_CATALOG.find((p) => p.planType === params.planType)
  if (!plan) throw new Error('套餐不存在')

  const state = readState()
  const summary = toSummary(state)
  const productType: Api.Subscription.ProductType =
    summary.planType === params.planType && summary.status !== 'expired'
      ? 'renewal'
      : 'subscription'

  const createdAt = nowIso()
  const order: Api.Subscription.OrderItem = {
    id: nextOrderId(state.orders),
    orderNo: nextOrderNo(state.orders),
    productType,
    productName: productType === 'renewal' ? `${plan.name}·续费` : plan.name,
    amount: plan.price,
    paymentMethod: params.paymentMethod,
    paymentStatus: 1,
    paidAt: createdAt,
    createdAt,
    grantedQuota: { person: plan.personQuota, storageMb: plan.storageQuotaMb }
  }

  state.autoRenew = !!params.autoRenew
  applyPlanToState(state, plan, productType)
  state.orders.unshift(order)
  writeState(state)
  return order
}

/** Mock 购买扩容包 */
export async function mockPurchaseExpand(
  params: Api.Subscription.PurchaseExpandParams
): Promise<Api.Subscription.OrderItem> {
  await delay(400)
  const pack = EXPAND_PACKS.find((p) => p.id === params.packId)
  if (!pack) throw new Error('扩容包不存在')

  const state = readState()
  const summary = toSummary(state)
  if (summary.status === 'expired') throw new Error('订阅已过期，请先续费再购买扩容包')
  if (summary.planType === 'trial') throw new Error('试用套餐不支持购买扩容包，请先升级')

  const createdAt = nowIso()
  const order: Api.Subscription.OrderItem = {
    id: nextOrderId(state.orders),
    orderNo: nextOrderNo(state.orders),
    productType: pack.productType,
    productName: pack.name,
    amount: pack.amount,
    paymentMethod: params.paymentMethod,
    paymentStatus: 1,
    paidAt: createdAt,
    createdAt,
    grantedQuota: { person: pack.personAdd, storageMb: pack.storageAddMb }
  }

  if (pack.personAdd > 0) {
    state.personQuota += pack.personAdd
    state.transactions.unshift({
      id: nextTxId(state.transactions),
      quotaType: 'person',
      changeType: 'expand',
      changeAmount: pack.personAdd,
      balanceAfter: Math.max(0, state.personQuota - countPersonQuotaUsed()),
      operatorName: '当前用户',
      remark: pack.name,
      orderId: order.id,
      createdAt
    })
  }
  if (pack.storageAddMb > 0) {
    state.storageQuotaMb += pack.storageAddMb
    state.transactions.unshift({
      id: nextTxId(state.transactions),
      quotaType: 'storage',
      changeType: 'expand',
      changeAmount: pack.storageAddMb,
      balanceAfter: Math.max(0, state.storageQuotaMb - state.storageUsedMb),
      operatorName: '当前用户',
      remark: pack.name,
      orderId: order.id,
      createdAt
    })
  }

  state.orders.unshift(order)
  writeState(state)
  return order
}

export async function mockSetAutoRenew(autoRenew: boolean): Promise<Api.Subscription.Summary> {
  await delay()
  const state = readState()
  if (toSummary(state).status === 'expired') throw new Error('订阅已过期，请先续费')
  if (state.planType === 'trial') throw new Error('试用套餐不支持自动续费')
  state.autoRenew = autoRenew
  writeState(state)
  return toSummary(state)
}

/** QA / Mock：模拟正式订阅中 / 过期 / 恢复试用 / 压满额度 */
export async function mockSimulateSubscription(
  scenario: Api.Subscription.SimulateScenario
): Promise<Api.Subscription.Summary> {
  await delay()
  const state = readState()
  if (scenario === 'expire') {
    state.statusCode = 2
    state.expireDate = addDays(new Date(), -1)
  } else if (scenario === 'restore_trial') {
    Object.assign(state, defaultState())
  } else if (scenario === 'exhaust_person') {
    const used = countPersonQuotaUsed()
    state.personQuota = Math.max(0, used)
    state.statusCode = 1
    if (new Date(state.expireDate).getTime() < Date.now()) {
      state.expireDate = addDays(new Date(), 30)
    }
  } else if (scenario === 'active_basic') {
    // 正常「正式订阅中」：基础年付生效，额度未满，便于对照过期/额度拦截
    const basic = PLAN_CATALOG.find((p) => p.planType === 'basic')
    if (!basic) throw new Error('未找到基础年付套餐配置')
    applyPlanToState(state, basic, 'subscription')
    state.autoRenew = true
  }
  writeState(state)
  return toSummary(state)
}

/** 彻底删除人物后记录额度返还流水（由 person mock 调用） */
export function appendPersonPurgeTransaction(changeAmount: number, remark: string) {
  if (changeAmount <= 0) return
  const state = readState()
  const used = countPersonQuotaUsed()
  state.transactions.unshift({
    id: nextTxId(state.transactions),
    quotaType: 'person',
    changeType: 'manual_purge',
    changeAmount,
    balanceAfter: Math.max(0, state.personQuota - used),
    operatorName: '当前用户',
    remark,
    createdAt: nowIso()
  })
  writeState(state)
}

/** 存储额度用尽：禁止上传（§0.8） */
export function assertStorageQuotaAvailable(extraBytes: number) {
  const summary = getSubscriptionSummarySync()
  const extraMb = extraBytes / (1024 * 1024)
  if (summary.storageUsedMb + extraMb > summary.storageLimitMb + 1e-6) {
    throw new Error('存储额度已用尽，请扩容或清理回收站后再上传')
  }
}

/**
 * 按占用字节同步 storageUsedMb（含回收站附件）
 * deltaBytes > 0 增加占用（consume）；< 0 释放占用（manual_purge）
 */
export function applyStorageUsageDelta(deltaBytes: number, remark: string) {
  if (!deltaBytes) return
  const state = readState()
  const deltaMb = deltaBytes / (1024 * 1024)
  state.storageUsedMb = Math.max(0, Number((state.storageUsedMb + deltaMb).toFixed(4)))
  const changeType: ChangeType = deltaBytes > 0 ? 'consume' : 'manual_purge'
  state.transactions.unshift({
    id: nextTxId(state.transactions),
    quotaType: 'storage',
    changeType,
    changeAmount: Number(Math.abs(deltaMb).toFixed(4)),
    balanceAfter: Math.max(0, Number((state.storageQuotaMb - state.storageUsedMb).toFixed(4))),
    operatorName: '当前用户',
    remark,
    createdAt: nowIso()
  })
  writeState(state)
}

/** 将存储已用重算为指定 MB（全量同步用） */
export function setStorageUsedMb(usedMb: number) {
  const state = readState()
  state.storageUsedMb = Math.max(0, Number(usedMb.toFixed(4)))
  writeState(state)
}
