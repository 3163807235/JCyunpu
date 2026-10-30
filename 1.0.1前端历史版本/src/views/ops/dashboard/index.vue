<!-- 运营工作台 · §2.3 后台页面 01 · 模块 N1 -->
<template>
  <div v-loading="loading" class="ops-dashboard p-1">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <button
        v-for="card in metricCards"
        :key="card.label"
        type="button"
        class="art-card p-4 text-left tad-300 hover:border-theme"
        @click="card.onClick?.()"
      >
        <p class="text-xs text-g-500 mb-1">{{ card.label }}</p>
        <p class="text-2xl font-medium">{{ card.value }}</p>
        <p v-if="card.hint" class="text-xs text-g-400 mt-1">{{ card.hint }}</p>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
      <div class="art-card p-5">
        <h3 class="text-base font-medium mb-3">修谱阶段分布</h3>
        <div class="space-y-2">
          <div v-for="s in stageRows" :key="s.stage" class="flex-cb text-sm">
            <span>{{ s.label }}</span>
            <ElTag size="small" type="info">{{ s.count }}</ElTag>
          </div>
        </div>
      </div>
      <div class="art-card p-5">
        <h3 class="text-base font-medium mb-3">风险预警</h3>
        <ElAlert
          class="mb-2!"
          :type="stats?.expireSoonCount ? 'warning' : 'success'"
          :closable="false"
          :title="`即将过期（7天内）：${stats?.expireSoonCount ?? 0}`"
        />
        <ElAlert
          :type="stats?.quotaExhaustedCount ? 'error' : 'success'"
          :closable="false"
          :title="`人物额度耗尽租户：${stats?.quotaExhaustedCount ?? 0}`"
        />
        <div class="mt-4 flex flex-wrap gap-2">
          <ElButton type="primary" plain @click="go('/ops/users')">用户管理</ElButton>
          <ElButton type="primary" plain @click="go('/ops/orders')">订单管理</ElButton>
          <ElButton type="primary" plain @click="go('/ops/audit')">审计日志</ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { fetchOpsDashboard, type OpsDashboardStats } from '@/api/ops'

  defineOptions({ name: 'OpsDashboard' })

  const router = useRouter()
  const loading = ref(false)
  const stats = ref<OpsDashboardStats | null>(null)

  const go = (path: string) => router.push(path)

  const metricCards = computed(() => {
    const s = stats.value
    return [
      {
        label: '注册用户',
        value: s?.userTotal ?? '—',
        hint: `付费用户 ${s?.paidUserCount ?? 0}`,
        onClick: () => go('/ops/users')
      },
      {
        label: '族谱数',
        value: s?.genealogyTotal ?? '—',
        hint: `人物 ${s?.personTotal ?? 0}`,
        onClick: () => go('/ops/users')
      },
      {
        label: '本月订单',
        value: s?.orderMonthCount ?? '—',
        hint: `营收 ¥${(s?.orderMonthAmount ?? 0).toFixed(0)}`,
        onClick: () => go('/ops/orders')
      },
      {
        label: '附件占用',
        value: `${s?.storageUsedMb ?? 0} MB`,
        hint: '含回收站占用'
      }
    ]
  })

  const stageRows = computed(() => {
    const c = stats.value?.stageCounts || {}
    return [
      { stage: 1, label: '项目启动', count: c[1] || 0 },
      { stage: 2, label: '内容编排', count: c[2] || 0 },
      { stage: 3, label: '校对', count: c[3] || 0 },
      { stage: 4, label: '智能排版', count: c[4] || 0 },
      { stage: 5, label: '发布归档', count: c[5] || 0 }
    ]
  })

  const load = async () => {
    loading.value = true
    try {
      stats.value = await fetchOpsDashboard()
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
</script>
