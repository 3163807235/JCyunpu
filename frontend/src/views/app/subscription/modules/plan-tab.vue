<!-- 我的套餐 · v3.1.6 §3.4 页面 13 Tab1 -->
<template>
  <div v-loading="loading" class="py-2">
    <div class="flex flex-wrap gap-4 mb-5">
      <div class="min-w-50 flex-1 art-card border border-g-200 p-4">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-lg font-medium">{{ summary?.planName || '—' }}</h3>
          <ElTag size="small" :type="statusTagType">{{ statusLabel }}</ElTag>
        </div>
        <p class="mt-2 text-sm text-g-600">有效期至 {{ summary?.expireAt || '—' }}</p>
        <p class="mt-1 text-sm text-g-500">剩余约 {{ remainDays }} 天</p>
        <p class="mt-1 text-sm text-g-500">
          自动续费：{{ summary?.autoRenew ? '已开启' : '未开启' }}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <ElButton type="primary" v-ripple @click="emit('go-purchase')">
            {{ summary?.status === 'expired' ? '立即续费' : '升级 / 续费' }}
          </ElButton>
          <ElButton
            v-if="summary && summary.planType !== 'trial' && !expired"
            @click="toggleAutoRenew"
          >
            {{ summary.autoRenew ? '关闭自动续费' : '开启自动续费' }}
          </ElButton>
          <ElButton @click="emit('go-purchase')">购买扩容包</ElButton>
        </div>
      </div>

      <div class="min-w-70 flex-[1.4] art-card border border-g-200 p-4 space-y-4">
        <h4 class="text-sm font-medium text-g-700">额度面板</h4>
        <div>
          <div class="flex-cb text-sm mb-1">
            <span>人物额度</span>
            <span>{{ summary?.personUsed ?? 0 }} / {{ summary?.personLimit ?? 0 }}</span>
          </div>
          <ElProgress :percentage="personPercent" :stroke-width="8" />
        </div>
        <div>
          <div class="flex-cb text-sm mb-1">
            <span>存储额度</span>
            <span>{{ summary?.storageUsedMb ?? 0 }}MB / {{ summary?.storageLimitMb ?? 0 }}MB</span>
          </div>
          <ElProgress :percentage="storagePercent" :stroke-width="8" status="success" />
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm text-g-600">
          <div>AI OCR 剩余：{{ ocrLabel }}</div>
          <div>协作人数上限：{{ summary?.maxCollaborators ?? '—' }}</div>
          <div>续修次数：{{ continuationLabel }}</div>
          <div>族谱上限：{{ summary?.maxGenealogyCount ?? 1 }}（MVP）</div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-g-600 inline-flex items-center gap-1">
        Mock 调试
        <PageTipIcon
          content="可模拟正式订阅中 / 过期 / 额度用尽 / 恢复试用，便于验收拦截规则（仅前端 Mock）。"
        />
      </span>
      <ElButton
        size="small"
        type="success"
        plain
        :loading="simulating"
        @click="simulate('active_basic')"
      >
        模拟正式订阅中
      </ElButton>
      <ElButton size="small" type="danger" plain :loading="simulating" @click="simulate('expire')">
        模拟订阅过期
      </ElButton>
      <ElButton
        size="small"
        type="warning"
        plain
        :loading="simulating"
        @click="simulate('exhaust_person')"
      >
        模拟人物额度用尽
      </ElButton>
      <ElButton size="small" plain :loading="simulating" @click="simulate('restore_trial')">
        恢复试用套餐
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchSetAutoRenew,
    fetchSimulateSubscription,
    fetchSubscriptionSummary
  } from '@/api/subscription'

  defineOptions({ name: 'SubscriptionPlanTab' })

  const emit = defineEmits<{
    'go-purchase': []
    refreshed: []
  }>()

  const loading = ref(false)
  const simulating = ref(false)
  const summary = ref<Api.Subscription.Summary | null>(null)

  const expired = computed(() => summary.value?.status === 'expired')
  const statusLabel = computed(() => {
    const map: Record<Api.Subscription.Status, string> = {
      trial: '试用中',
      active: '正式订阅',
      expired: '已过期'
    }
    return summary.value ? map[summary.value.status] : '—'
  })
  const statusTagType = computed(() => {
    if (summary.value?.status === 'expired') return 'danger'
    if (summary.value?.status === 'trial') return 'warning'
    return 'success'
  })
  const remainDays = computed(() => {
    if (!summary.value?.expireAt) return 0
    return Math.max(
      0,
      Math.ceil((new Date(summary.value.expireAt).getTime() - Date.now()) / 86400000)
    )
  })
  const personPercent = computed(() => {
    if (!summary.value?.personLimit) return 0
    return Math.min(100, Math.round((summary.value.personUsed / summary.value.personLimit) * 100))
  })
  const storagePercent = computed(() => {
    if (!summary.value?.storageLimitMb) return 0
    return Math.min(
      100,
      Math.round((summary.value.storageUsedMb / summary.value.storageLimitMb) * 100)
    )
  })
  const ocrLabel = computed(() => {
    const n = summary.value?.ocrRemaining
    if (n == null) return '—'
    return n >= 9999 ? '无限' : `${n} 次`
  })
  const continuationLabel = computed(() => {
    if (!summary.value) return '—'
    const max = summary.value.maxContinuationCount
    if (max < 0) return `${summary.value.continuationUsed} / 无限`
    return `${summary.value.continuationUsed} / ${max}`
  })

  const load = async () => {
    loading.value = true
    try {
      summary.value = await fetchSubscriptionSummary()
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const toggleAutoRenew = async () => {
    if (!summary.value) return
    try {
      summary.value = await fetchSetAutoRenew(!summary.value.autoRenew)
      ElMessage.success(summary.value.autoRenew ? '已开启自动续费' : '已关闭自动续费')
      emit('refreshed')
    } catch (e: any) {
      ElMessage.error(e?.message || '操作失败')
    }
  }

  const simulate = async (scenario: Api.Subscription.SimulateScenario) => {
    simulating.value = true
    try {
      summary.value = await fetchSimulateSubscription(scenario)
      ElMessage.success('已更新 Mock 订阅状态')
      emit('refreshed')
    } catch (e: any) {
      ElMessage.error(e?.message || '模拟失败')
    } finally {
      simulating.value = false
    }
  }

  onMounted(load)
  defineExpose({ reload: load })
</script>
