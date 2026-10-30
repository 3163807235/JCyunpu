<!-- 顶部状态横幅：试用/订阅/到期引导 · 产品文档 §3.4 页面 01 -->
<template>
  <div
    class="art-card flex-cb gap-4 px-5 py-4 mb-5 max-sm:mb-4 max-sm:flex-col max-sm:items-start"
    :class="bannerClass"
  >
    <div class="flex items-start gap-3 min-w-0">
      <div class="size-10 rounded-xl flex-cc shrink-0 bg-theme/10">
        <ArtSvgIcon :icon="statusIcon" class="text-xl text-theme" />
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-base font-medium">{{ summary?.planName || '加载中…' }}</h3>
          <ElTag v-if="summary" size="small" :type="statusTagType">{{ statusLabel }}</ElTag>
        </div>
        <p class="mt-1 text-sm text-g-600">
          {{ statusDesc }}
        </p>
      </div>
    </div>
    <div class="flex gap-2 shrink-0">
      <ElButton @click="router.push('/genealogies')">我的族谱</ElButton>
      <ElButton
        type="primary"
        v-ripple
        @click="mittBus.emit('openSubscription', ctaTab)"
      >
        {{ ctaLabel }}
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'
  import { mittBus } from '@/utils/sys'

  const router = useRouter()
  const { summary, expired, quotaExhausted, refresh } = useSubscriptionGuard()

  const statusLabel = computed(() => {
    if (!summary.value) return ''
    const map: Record<Api.Subscription.Status, string> = {
      trial: '试用中',
      active: '正式订阅',
      expired: '已过期'
    }
    return map[summary.value.status]
  })

  const statusTagType = computed(() => {
    if (expired.value) return 'danger'
    if (quotaExhausted.value) return 'warning'
    if (summary.value?.status === 'trial') return 'warning'
    return 'success'
  })

  const statusIcon = computed(() => {
    if (expired.value) return 'ri:alarm-warning-line'
    if (quotaExhausted.value) return 'ri:error-warning-line'
    if (summary.value?.status === 'trial') return 'ri:time-line'
    return 'ri:vip-crown-line'
  })

  const statusDesc = computed(() => {
    if (!summary.value) return '正在加载订阅状态…'
    if (expired.value) {
      return '订阅已过期：全只读模式，禁止新增/编辑/导入/导出，仅可浏览。请续费后恢复。'
    }
    if (quotaExhausted.value) {
      return `人物额度已用尽（${summary.value.personUsed}/${summary.value.personLimit}）：禁止新增，仍可编辑已有数据。请扩容或清理回收站。`
    }
    const days = summary.value.expireAt
      ? Math.max(
          0,
          Math.ceil((new Date(summary.value.expireAt).getTime() - Date.now()) / 86400000)
        )
      : 0
    if (summary.value.status === 'trial') {
      return `试用剩余约 ${days} 天（至 ${summary.value.expireAt}）。试用仅支持预览导出，升级后可印刷成册。`
    }
    return `当前订阅有效至 ${summary.value.expireAt}，剩余约 ${days} 天。`
  })

  const ctaLabel = computed(() => {
    if (expired.value) return '立即续费'
    if (quotaExhausted.value) return '购买扩容'
    return '查看套餐'
  })

  const ctaTab = computed(() => (expired.value || quotaExhausted.value ? 'purchase' : 'plan'))

  const bannerClass = computed(() =>
    expired.value || quotaExhausted.value ? 'border border-[var(--el-color-danger)]' : ''
  )

  onMounted(refresh)
</script>
