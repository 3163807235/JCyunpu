<template>
  <div class="art-card h-105 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>额度使用</h4>
        <p>
          人物额度剩余
          <span class="text-theme">{{ personRemain }}</span>
        </p>
      </div>
    </div>

    <div class="mt-6 space-y-6">
      <div>
        <div class="flex-cb text-sm mb-2">
          <span class="text-g-700">人物额度</span>
          <span class="text-g-600">{{ summary?.personUsed ?? 0 }} / {{ summary?.personLimit ?? 0 }}</span>
        </div>
        <ElProgress
          :percentage="personPercent"
          :stroke-width="10"
          :aria-label="`人物额度已用 ${personPercent}%`"
        />
      </div>

      <div>
        <div class="flex-cb text-sm mb-2">
          <span class="text-g-700">存储额度</span>
          <span class="text-g-600"
            >{{ summary?.storageUsedMb ?? 0 }}MB / {{ summary?.storageLimitMb ?? 0 }}MB</span
          >
        </div>
        <ElProgress
          :percentage="storagePercent"
          :stroke-width="10"
          status="success"
          :aria-label="`存储额度已用 ${storagePercent}%`"
        />
      </div>

      <ArtLineChart
        height="9.5rem"
        :data="data"
        :xAxisData="xAxisData"
        :showAreaColor="true"
        :showAxisLine="false"
      />
      <p class="text-xs text-g-500 -mt-1">近 12 周人物录入趋势（Mock）</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'

  const { summary, refresh } = useSubscriptionGuard()

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
  const personRemain = computed(() =>
    summary.value ? Math.max(0, summary.value.personLimit - summary.value.personUsed) : 0
  )

  const data = [8, 12, 6, 15, 10, 18, 9, 14, 11, 7, 16, 12]
  const xAxisData = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']

  onMounted(refresh)
</script>
