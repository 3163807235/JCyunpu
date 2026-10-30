<!-- 购买续费 · v3.1.6 §3.4 页面 13 Tab2 -->
<template>
  <div v-loading="loading" class="py-2">
    <h3 class="text-base font-medium mb-3">套餐对比</h3>
    <ElRow :gutter="16" class="mb-6">
      <ElCol v-for="plan in plans" :key="plan.planType" :xs="24" :sm="8">
        <div
          class="art-card border p-4 mb-4 h-full flex flex-col cursor-pointer transition-colors"
          :class="
            selectedPlan === plan.planType
              ? 'border-theme ring-1 ring-theme/30'
              : 'border-g-200 hover:border-theme/50'
          "
          @click="onSelectPlan(plan)"
        >
          <div class="flex-cb">
            <h4 class="text-lg font-medium">{{ plan.name }}</h4>
            <ElTag v-if="plan.planType === currentPlanType" size="small" type="success"
              >当前</ElTag
            >
          </div>
          <p class="mt-2 text-2xl font-semibold text-theme">
            <template v-if="plan.price === 0">免费</template>
            <template v-else>¥{{ plan.price }}<span class="text-sm font-normal">/年</span></template>
          </p>
          <ul class="mt-3 space-y-1 text-sm text-g-600 flex-1">
            <li v-for="(f, i) in plan.features" :key="i">· {{ f }}</li>
          </ul>
          <ElButton
            class="mt-4"
            type="primary"
            plain
            :disabled="plan.planType === 'trial'"
            @click.stop="onSelectPlan(plan)"
          >
            {{ plan.planType === 'trial' ? '试用不可购买' : '选择此套餐' }}
          </ElButton>
        </div>
      </ElCol>
    </ElRow>

    <h3 class="text-base font-medium mb-3">扩容包</h3>
    <ElAlert
      v-if="!packs.length"
      class="mb-4!"
      type="info"
      :closable="false"
      title="试用或过期状态下不可购买扩容包；请先升级/续费基础或专业套餐。"
    />
    <div v-else class="flex flex-wrap gap-3 mb-6">
      <div
        v-for="pack in packs"
        :key="pack.id"
        class="art-card border border-g-200 px-4 py-3 min-w-45 cursor-pointer"
        :class="selectedPackId === pack.id ? 'border-theme ring-1 ring-theme/30' : ''"
        @click="selectedPackId = pack.id; selectedPlan = null"
      >
        <p class="font-medium">{{ pack.name }}</p>
        <p class="mt-1 text-theme">¥{{ pack.amount }}</p>
      </div>
    </div>

    <h3 class="text-base font-medium mb-3">确认支付（Mock）</h3>
    <div class="art-card border border-g-200 p-4 max-w-xl">
      <p class="text-sm text-g-600 mb-3">
        商品：{{ checkoutLabel }}
      </p>
      <div class="mb-3">
        <span class="text-sm mr-3">支付方式</span>
        <ElRadioGroup v-model="paymentMethod">
          <ElRadioButton value="wechat">微信支付</ElRadioButton>
          <ElRadioButton value="alipay">支付宝</ElRadioButton>
        </ElRadioGroup>
      </div>
      <ElCheckbox
        v-if="selectedPlan && selectedPlan !== 'trial'"
        v-model="autoRenew"
        class="mb-3"
      >
        开启自动续费（优先续费保障）
      </ElCheckbox>
      <ElButton type="primary" :disabled="!canPay" :loading="paying" v-ripple @click="onPay">
        确认支付 ¥{{ payAmount }}
      </ElButton>
      <p class="mt-2 text-xs text-g-500">Mock 支付将即时成功并更新套餐/额度，无需真实收款。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchExpandPacks,
    fetchPurchaseExpand,
    fetchPurchasePlan,
    fetchSubscriptionPlans,
    fetchSubscriptionSummary
  } from '@/api/subscription'

  defineOptions({ name: 'SubscriptionPurchaseTab' })

  const emit = defineEmits<{ paid: [] }>()

  const loading = ref(false)
  const paying = ref(false)
  const plans = ref<Api.Subscription.PlanOption[]>([])
  const packs = ref<Api.Subscription.ExpandPack[]>([])
  const currentPlanType = ref<Api.Subscription.PlanType>('trial')
  const selectedPlan = ref<Api.Subscription.PlanType | null>('basic')
  const selectedPackId = ref<string | null>(null)
  const paymentMethod = ref<Api.Subscription.PaymentMethod>('wechat')
  const autoRenew = ref(false)

  const selectedPack = computed(() => packs.value.find((p) => p.id === selectedPackId.value))
  const selectedPlanOption = computed(() =>
    plans.value.find((p) => p.planType === selectedPlan.value)
  )
  const checkoutLabel = computed(() => {
    if (selectedPack.value) return selectedPack.value.name
    if (selectedPlanOption.value) return selectedPlanOption.value.name
    return '请选择套餐或扩容包'
  })
  const payAmount = computed(() => {
    if (selectedPack.value) return selectedPack.value.amount
    if (selectedPlanOption.value) return selectedPlanOption.value.price
    return 0
  })
  const canPay = computed(
    () =>
      !!selectedPack.value ||
      (!!selectedPlan.value && selectedPlan.value !== 'trial' && !!selectedPlanOption.value)
  )

  const onSelectPlan = (plan: Api.Subscription.PlanOption) => {
    if (plan.planType === 'trial') return
    selectedPlan.value = plan.planType
    selectedPackId.value = null
  }

  const load = async () => {
    loading.value = true
    try {
      const [planList, packList, summary] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchExpandPacks(),
        fetchSubscriptionSummary()
      ])
      plans.value = planList
      packs.value = packList
      currentPlanType.value = summary.planType
      if (summary.status === 'expired') {
        selectedPlan.value = summary.planType === 'trial' ? 'basic' : summary.planType
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const onPay = async () => {
    if (!canPay.value) return
    paying.value = true
    try {
      if (selectedPackId.value) {
        await fetchPurchaseExpand({
          packId: selectedPackId.value,
          paymentMethod: paymentMethod.value
        })
        ElMessage.success('扩容包购买成功，额度已增加')
      } else if (selectedPlan.value && selectedPlan.value !== 'trial') {
        await fetchPurchasePlan({
          planType: selectedPlan.value,
          paymentMethod: paymentMethod.value,
          autoRenew: autoRenew.value
        })
        ElMessage.success('支付成功，套餐已生效')
      }
      emit('paid')
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '支付失败')
    } finally {
      paying.value = false
    }
  }

  onMounted(load)
  defineExpose({ reload: load })
</script>
