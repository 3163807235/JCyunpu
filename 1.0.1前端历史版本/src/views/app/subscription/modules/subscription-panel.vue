<!-- 会员订阅中心内容 · 产品文档 v3.1.6 §3.4 页面 13 -->
<template>
  <ElTabs v-model="activeTab" @tab-change="onTabChange">
    <ElTabPane label="我的套餐" name="plan">
      <PlanTab ref="planRef" @go-purchase="setTab('purchase')" @refreshed="onRefreshed" />
    </ElTabPane>
    <ElTabPane label="购买续费" name="purchase">
      <PurchaseTab ref="purchaseRef" @paid="onPaid" />
    </ElTabPane>
    <ElTabPane label="额度流水" name="quota">
      <QuotaTab ref="quotaRef" />
    </ElTabPane>
    <ElTabPane label="我的订单" name="orders">
      <OrdersTab ref="ordersRef" />
    </ElTabPane>
  </ElTabs>
</template>

<script setup lang="ts">
  import PlanTab from './plan-tab.vue'
  import PurchaseTab from './purchase-tab.vue'
  import QuotaTab from './quota-tab.vue'
  import OrdersTab from './orders-tab.vue'

  defineOptions({ name: 'SubscriptionPanel' })

  const props = withDefaults(
    defineProps<{
      /** 初始 Tab */
      initialTab?: string
    }>(),
    {
      initialTab: 'plan'
    }
  )

  const emit = defineEmits<{
    'tab-change': [tab: string]
  }>()

  const VALID_TABS = ['plan', 'purchase', 'quota', 'orders'] as const

  const normalizeTab = (tab?: string) =>
    tab && (VALID_TABS as readonly string[]).includes(tab) ? tab : 'plan'

  const activeTab = ref(normalizeTab(props.initialTab))
  const planRef = ref<{ reload: () => void }>()
  const purchaseRef = ref<{ reload: () => void }>()
  const quotaRef = ref<{ reload: () => void }>()
  const ordersRef = ref<{ reload: () => void }>()

  const setTab = (tab: string) => {
    activeTab.value = normalizeTab(tab)
    emit('tab-change', activeTab.value)
  }

  const onTabChange = (name: string | number) => {
    emit('tab-change', String(name))
  }

  const onPaid = () => {
    planRef.value?.reload()
    quotaRef.value?.reload()
    ordersRef.value?.reload()
    setTab('plan')
  }

  const onRefreshed = () => {
    purchaseRef.value?.reload()
    quotaRef.value?.reload()
  }

  watch(
    () => props.initialTab,
    (tab) => {
      if (tab) setTab(tab)
    }
  )

  defineExpose({
    setTab,
    reload: () => {
      planRef.value?.reload()
      purchaseRef.value?.reload()
      quotaRef.value?.reload()
      ordersRef.value?.reload()
    }
  })
</script>
