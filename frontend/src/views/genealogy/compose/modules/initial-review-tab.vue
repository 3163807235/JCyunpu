<!-- 初审检查 Tab · 分页对齐人员列表 -->
<template>
  <div class="compose-pane">
    <ArtTableHeader class="shrink-0" layout="refresh" :loading="loading" @refresh="scan">
      <template #left>
        <ElSpace wrap>
          <span class="text-sm text-g-500">
            自动扫描人物、关系与章节；确认后可推进至
            {{ isSimple ? '智能排版' : '校对' }}
          </span>
          <ElButton @click="scan">重新扫描</ElButton>
          <ElButton type="primary" plain :disabled="!items.length" @click="confirmAll">
            全部确认
          </ElButton>
        </ElSpace>
      </template>
    </ArtTableHeader>

    <ElAlert
      v-if="blockingErrors"
      class="mb-3! shrink-0"
      type="error"
      :closable="false"
      title="仍有未确认的错误项，建议处理后再推进。"
    />

    <div class="compose-pane__table">
      <ArtTable
        :loading="loading"
        :data="pageRows"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="false"
        empty-text="未发现问题，可推进下一阶段"
        @pagination:size-change="onSizeChange"
        @pagination:current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElTag } from 'element-plus'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { runInitialReview, type ReviewCheckItem } from '@/utils/genealogy/review-check'
  import type { ColumnOption } from '@/types'

  defineOptions({ name: 'InitialReviewTab' })

  const props = defineProps<{ genealogyId: number }>()
  const genealogyStore = useGenealogyStore()

  const loading = ref(false)
  const items = ref<ReviewCheckItem[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const isSimple = computed(() => genealogyStore.currentMode === 'simple')

  const blockingErrors = computed(() =>
    items.value.some((i) => i.severity === 'error' && !i.confirmed)
  )

  const slicePage = <T,>(list: T[], page: { current: number; size: number; total: number }) => {
    page.total = list.length
    const maxPage = Math.max(1, Math.ceil(list.length / page.size) || 1)
    if (page.current > maxPage) page.current = maxPage
    const start = (page.current - 1) * page.size
    return list.slice(start, start + page.size)
  }

  const pageRows = computed(() => slicePage(items.value, pagination))

  const tagType = (s: ReviewCheckItem['severity']) => {
    if (s === 'error') return 'danger' as const
    if (s === 'warn') return 'warning' as const
    return 'info' as const
  }

  const columns = computed<ColumnOption[]>(() => [
    {
      prop: 'severity',
      label: '级别',
      width: 90,
      formatter: (row: ReviewCheckItem) =>
        h(ElTag, { size: 'small', type: tagType(row.severity) }, () => row.severity)
    },
    {
      prop: 'category',
      label: '分类',
      width: 100,
      formatter: (row: ReviewCheckItem) =>
        h(ElTag, { size: 'small', type: 'info' }, () => row.category)
    },
    {
      prop: 'title',
      label: '问题',
      minWidth: 160,
      formatter: (row: ReviewCheckItem) =>
        h('div', { class: 'flex items-center gap-2 flex-wrap' }, [
          h('span', { class: 'text-sm font-medium' }, row.title),
          row.confirmed ? h(ElTag, { size: 'small', type: 'success' }, () => '已确认') : null
        ])
    },
    {
      prop: 'detail',
      label: '说明',
      minWidth: 200,
      formatter: (row: ReviewCheckItem) =>
        h('span', { class: 'text-xs text-g-500' }, row.detail || '—')
    },
    {
      prop: 'operation',
      label: '操作',
      width: 100,
      fixed: 'right',
      formatter: (row: ReviewCheckItem) => {
        if (row.confirmed) return h('span', { class: 'text-g-400' }, '—')
        return h(
          ElButton,
          {
            link: true,
            type: 'primary',
            onClick: () => {
              row.confirmed = true
            }
          },
          () => '确认'
        )
      }
    }
  ])

  const scan = () => {
    loading.value = true
    try {
      items.value = runInitialReview(props.genealogyId).map((i) => ({ ...i, confirmed: false }))
      pagination.total = items.value.length
      pagination.current = 1
    } finally {
      loading.value = false
    }
  }

  const confirmAll = () => {
    items.value.forEach((i) => {
      i.confirmed = true
    })
  }

  const onSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
  }
  const onPageChange = (page: number) => {
    pagination.current = page
  }

  watch(
    () => props.genealogyId,
    () => {
      pagination.current = 1
      scan()
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .compose-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .compose-pane__table {
    flex: 1;
    min-height: 0;
    overflow: hidden;

    :deep(.art-table) {
      height: 100% !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .el-table {
        flex: 1;
        min-height: 0;
        margin-top: 0;
      }

      .pagination {
        flex-shrink: 0;
        margin-top: 8px;
      }
    }
  }
</style>
