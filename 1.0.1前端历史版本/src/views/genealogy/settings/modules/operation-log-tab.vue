<!-- 操作日志 · §3.4 页面 12 / §1.7.17 -->
<template>
  <div class="operation-log-tab">
    <ArtSearchBar v-model="searchForm" :items="searchItems" @search="onSearch" @reset="onReset" />

    <ElCard class="art-table-card !mb-0 mt-3" shadow="never">
      <ArtTableHeader layout="refresh" :loading="loading" @refresh="load">
        <template #left>
          <span class="text-sm text-g-600 inline-flex items-center gap-1">
            操作日志
            <PageTipIcon
              content="操作日志永久留存，不可删除、不可篡改。覆盖数据 / 流程 / 协作 / 设置 / 文件 / AI 等类别。"
            />
          </span>
        </template>
      </ArtTableHeader>
      <ArtTable
        :loading="loading"
        :data="records"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="onSizeChange"
        @pagination:current-change="onPageChange"
      />
    </ElCard>

    <ElDialog v-model="detailVisible" title="日志详情" width="640px" align-center destroy-on-close>
      <template v-if="detail">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="时间">{{ detail.createdAt }}</ElDescriptionsItem>
          <ElDescriptionsItem label="操作人">
            {{ detail.operatorName || detail.operatorUserId || '—' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="类别">{{
            categoryLabel(detail.logCategory)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="动作">{{ detail.action }}</ElDescriptionsItem>
          <ElDescriptionsItem label="对象">
            {{ detail.targetType || '—' }}
            <span v-if="detail.targetId != null"> #{{ detail.targetId }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="摘要">{{ detail.changeSummary || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="IP">{{ detail.ipAddress }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.userAgent" label="UA">
            <span class="text-xs break-all">{{ detail.userAgent }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>
        <div v-if="detail.changeDetail && Object.keys(detail.changeDetail).length" class="mt-4">
          <h4 class="text-sm font-medium mb-2">变更详情</h4>
          <ElTable :data="detailRows" size="small" border>
            <ElTableColumn prop="field" label="字段" width="140" />
            <ElTableColumn prop="before" label="变更前" min-width="160">
              <template #default="{ row }">{{ formatVal(row.before) }}</template>
            </ElTableColumn>
            <ElTableColumn prop="after" label="变更后" min-width="160">
              <template #default="{ row }">{{ formatVal(row.after) }}</template>
            </ElTableColumn>
          </ElTable>
        </div>
      </template>
      <template #footer>
        <ElButton type="primary" @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage, ElTag } from 'element-plus'
  import { useRoute } from 'vue-router'
  import { fetchOperationLogList, fetchOperationLogOperators } from '@/api/operation-log'

  defineOptions({ name: 'OperationLogTab' })

  const route = useRoute()
  const genealogyId = computed(() => Number(route.params.id))

  const loading = ref(false)
  const records = ref<Api.OperationLog.Item[]>([])
  const operators = ref<Api.OperationLog.OperatorOption[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const detailVisible = ref(false)
  const detail = ref<Api.OperationLog.Item | null>(null)

  const searchForm = reactive<{
    logCategory: Api.OperationLog.Category | ''
    operatorUserId: number | ''
    dateRange: string[]
    keyword: string
  }>({
    logCategory: '',
    operatorUserId: '',
    dateRange: [],
    keyword: ''
  })

  const CATEGORY_OPTIONS: { label: string; value: Api.OperationLog.Category | '' }[] = [
    { label: '全部类别', value: '' },
    { label: '数据操作', value: 'data' },
    { label: '流程操作', value: 'flow' },
    { label: '协作操作', value: 'collab' },
    { label: '设置操作', value: 'setting' },
    { label: '文件操作', value: 'file' },
    { label: 'AI 操作', value: 'ai' },
    { label: '后台操作', value: 'admin' }
  ]

  const categoryLabel = (c: Api.OperationLog.Category) =>
    CATEGORY_OPTIONS.find((o) => o.value === c)?.label || c

  const categoryTagType = (
    c: Api.OperationLog.Category
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
      data: 'primary',
      flow: 'success',
      collab: 'warning',
      setting: 'info',
      file: 'info',
      ai: 'danger',
      admin: 'danger'
    }
    return map[c] || 'info'
  }

  const searchItems = computed(() => [
    {
      label: '操作类型',
      key: 'logCategory',
      type: 'select' as const,
      props: {
        clearable: true,
        placeholder: '全部类别',
        options: CATEGORY_OPTIONS.filter((o) => o.value !== '').map((o) => ({
          label: o.label,
          value: o.value
        }))
      }
    },
    {
      label: '操作人',
      key: 'operatorUserId',
      type: 'select' as const,
      props: {
        clearable: true,
        placeholder: '全部人员',
        options: operators.value.map((o) => ({
          label: o.displayName,
          value: o.userId
        }))
      }
    },
    {
      label: '时间范围',
      key: 'dateRange',
      type: 'daterange' as const,
      props: {
        style: { width: '100%' },
        type: 'daterange',
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD'
      }
    },
    {
      label: '关键词',
      key: 'keyword',
      type: 'input' as const,
      placeholder: '摘要 / 动作',
      clearable: true
    }
  ])

  const columns = computed(() => [
    {
      prop: 'createdAt',
      label: '时间',
      width: 170,
      formatter: (row: Api.OperationLog.Item) => row.createdAt
    },
    {
      prop: 'operatorName',
      label: '操作人',
      width: 120,
      formatter: (row: Api.OperationLog.Item) =>
        row.operatorName || String(row.operatorUserId || '—')
    },
    {
      prop: 'logCategory',
      label: '类别',
      width: 110,
      formatter: (row: Api.OperationLog.Item) =>
        h(ElTag, { size: 'small', type: categoryTagType(row.logCategory) }, () =>
          categoryLabel(row.logCategory)
        )
    },
    {
      prop: 'changeSummary',
      label: '摘要',
      minWidth: 200,
      formatter: (row: Api.OperationLog.Item) => row.changeSummary || row.action
    },
    {
      prop: 'action',
      label: '动作',
      width: 160,
      formatter: (row: Api.OperationLog.Item) => row.action
    },
    {
      prop: 'ops',
      label: '操作',
      width: 90,
      fixed: 'right' as const,
      formatter: (row: Api.OperationLog.Item) =>
        h(ElButton, { link: true, type: 'primary', onClick: () => openDetail(row) }, () => '详情')
    }
  ])

  const detailRows = computed(() => {
    if (!detail.value?.changeDetail) return []
    return Object.entries(detail.value.changeDetail).map(([field, val]) => ({
      field,
      before: val.before,
      after: val.after
    }))
  })

  const formatVal = (v: unknown) => {
    if (v === undefined || v === null || v === '') return '—'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  const loadOperators = async () => {
    if (!genealogyId.value) return
    try {
      operators.value = await fetchOperationLogOperators(genealogyId.value)
    } catch {
      operators.value = []
    }
  }

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      const [startDate, endDate] = searchForm.dateRange || []
      const res = await fetchOperationLogList({
        genealogyId: genealogyId.value,
        current: pagination.current,
        size: pagination.size,
        logCategory: searchForm.logCategory || undefined,
        operatorUserId: searchForm.operatorUserId || undefined,
        startDate,
        endDate,
        keyword: searchForm.keyword || undefined
      })
      records.value = res.records
      pagination.total = res.total
      pagination.current = res.current
      pagination.size = res.size
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const onSearch = () => {
    pagination.current = 1
    load()
  }

  const onReset = () => {
    searchForm.logCategory = ''
    searchForm.operatorUserId = ''
    searchForm.dateRange = []
    searchForm.keyword = ''
    pagination.current = 1
    load()
  }

  const onSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    load()
  }

  const onPageChange = (page: number) => {
    pagination.current = page
    load()
  }

  const openDetail = (row: Api.OperationLog.Item) => {
    detail.value = row
    detailVisible.value = true
  }

  watch(
    genealogyId,
    async () => {
      await loadOperators()
      pagination.current = 1
      await load()
    },
    { immediate: true }
  )
</script>
