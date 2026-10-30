<!-- 校对 · v3.1.6 §3.4 页面 07 · 布局/分页对齐人员列表 -->
<template>
  <div class="genealogy-review art-full-height">
    <StageFlowActions v-if="!isSimple" class="shrink-0" :page-stage="3" />

    <div class="flex-cb flex-wrap gap-2 mb-3 shrink-0">
      <div class="flex items-center gap-2 flex-wrap">
        <ElTag :type="reviewState.finalPassed ? 'success' : 'warning'" size="small">
          {{ reviewState.finalPassed ? '已终审放行' : '未终审' }}
        </ElTag>
        <ElTag size="small" type="info">存疑 {{ doubtRatioText }}</ElTag>
      </div>
      <ElButton
        type="primary"
        :disabled="reviewState.finalPassed || isSimple"
        :loading="finalizing"
        v-ripple
        @click="onFinalPass"
      >
        终审放行
      </ElButton>
    </div>

    <ElEmpty
      v-if="isSimple"
      class="mt-8"
      description="简易模式（快捷成谱）已跳过校对，请从内容编排推进至智能排版"
    />

    <ElCard v-else class="art-table-card review-main !mt-0" shadow="never">
      <ElTabs v-model="activeTab" class="review-tabs" @tab-change="onTabChange">
        <ElTabPane label="待审列表" name="pending">
          <div class="review-pane">
            <ArtTableHeader class="shrink-0" layout="refresh" :loading="loading" @refresh="load">
              <template #left>
                <span class="text-sm text-g-500">待处理 {{ pending.length }} 项</span>
              </template>
            </ArtTableHeader>
            <div class="review-pane__table">
              <ArtTable
                :loading="loading"
                :data="pendingPageRows"
                :columns="pendingColumns"
                :pagination="pendingPagination"
                :show-table-header="false"
                @pagination:size-change="onPendingSizeChange"
                @pagination:current-change="onPendingPageChange"
              />
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="疑点台账" name="doubts">
          <div class="review-pane">
            <ArtTableHeader class="shrink-0" layout="refresh" :loading="loading" @refresh="load">
              <template #left>
                <span class="text-sm text-g-500 inline-flex items-center gap-1">
                  存疑 {{ doubts.length }} 条
                  <PageTipIcon
                    content="存疑归档上限：存疑人物数 ≤ 总人物数的 5%，每条须填写原因与考证备注。"
                  />
                </span>
              </template>
            </ArtTableHeader>
            <div class="review-pane__table">
              <ArtTable
                :loading="loading"
                :data="doubtPageRows"
                :columns="doubtColumns"
                :pagination="doubtPagination"
                :show-table-header="false"
                @pagination:size-change="onDoubtSizeChange"
                @pagination:current-change="onDoubtPageChange"
              />
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="审核结果" name="logs">
          <div class="review-pane">
            <ArtTableHeader class="shrink-0" layout="refresh" :loading="loading" @refresh="load" />
            <div class="review-pane__table">
              <ArtTable
                :loading="loading"
                :data="logPageRows"
                :columns="logColumns"
                :pagination="logPagination"
                :show-table-header="false"
                @pagination:size-change="onLogSizeChange"
                @pagination:current-change="onLogPageChange"
              />
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { useRoute } from 'vue-router'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import {
    fetchDoubtList,
    fetchFinalPass,
    fetchPendingReview,
    fetchResolveDoubt,
    fetchReviewPerson,
    fetchReviewState
  } from '@/api/workflow'
  import { fetchPersonList } from '@/api/person'
  import StageFlowActions from '@/components/business/stage-flow-actions/index.vue'
  import type { ColumnOption } from '@/types'
  import type { ReviewState } from '@/mock/workflow'

  defineOptions({ name: 'GenealogyReview' })

  useGenealogyContext()

  const route = useRoute()
  const genealogyStore = useGenealogyStore()

  const genealogyId = computed(() => Number(route.params.id) || 0)
  const isSimple = computed(() => genealogyStore.currentMode === 'simple')
  const activeTab = ref('pending')
  const loading = ref(false)
  const finalizing = ref(false)
  const pending = ref<Api.Review.PendingItem[]>([])
  const doubts = ref<Api.Review.DoubtItem[]>([])
  const reviewState = ref<ReviewState>({ finalPassed: false, logs: [] })
  const personTotal = ref(0)

  const pendingPagination = reactive({ current: 1, size: 10, total: 0 })
  const doubtPagination = reactive({ current: 1, size: 10, total: 0 })
  const logPagination = reactive({ current: 1, size: 10, total: 0 })

  const slicePage = <T,>(list: T[], page: { current: number; size: number; total: number }) => {
    page.total = list.length
    const maxPage = Math.max(1, Math.ceil(list.length / page.size) || 1)
    if (page.current > maxPage) page.current = maxPage
    const start = (page.current - 1) * page.size
    return list.slice(start, start + page.size)
  }

  const pendingPageRows = computed(() => slicePage(pending.value, pendingPagination))
  const doubtPageRows = computed(() => slicePage(doubts.value, doubtPagination))
  const logPageRows = computed(() => slicePage(reviewState.value.logs, logPagination))

  const doubtRatioText = computed(() => {
    if (!personTotal.value) return '0/0'
    return `${doubts.value.length}/${personTotal.value}（${(
      (doubts.value.length / personTotal.value) *
      100
    ).toFixed(1)}%）`
  })

  const statusLabel = (s: Api.Person.ReviewStatus) => {
    if (s === 3) return '待整改'
    if (s === 2) return '存疑'
    if (s === 1) return '已通过'
    return '未审核'
  }

  const pendingColumns = computed<ColumnOption[]>(() => [
    {
      prop: 'title',
      label: '对象',
      minWidth: 140,
      formatter: (row: Api.Review.PendingItem) => row.title
    },
    {
      prop: 'detail',
      label: '说明',
      minWidth: 180,
      formatter: (row: Api.Review.PendingItem) => row.detail || '—'
    },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      formatter: (row: Api.Review.PendingItem) =>
        h(ElTag, { size: 'small', type: row.status === 3 ? 'danger' : 'warning' }, () =>
          statusLabel(row.status)
        )
    },
    {
      prop: 'operation',
      label: '操作',
      width: 220,
      fixed: 'right',
      formatter: (row: Api.Review.PendingItem) => {
        if (row.targetType !== 'person') {
          return h(ElTag, { size: 'small', type: 'info' }, () => '请在章节中补全文')
        }
        return h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
          h(
            ElButton,
            { size: 'small', type: 'success', plain: true, onClick: () => review(row, 1) },
            () => '通过'
          ),
          h(
            ElButton,
            { size: 'small', type: 'warning', plain: true, onClick: () => markDoubt(row) },
            () => '存疑'
          ),
          h(
            ElButton,
            { size: 'small', type: 'danger', plain: true, onClick: () => review(row, 3) },
            () => '驳回'
          )
        ])
      }
    }
  ])

  const doubtColumns = computed<ColumnOption[]>(() => [
    {
      prop: 'nameWei',
      label: '成员',
      minWidth: 120,
      formatter: (row: Api.Review.DoubtItem) => row.nameWei
    },
    {
      prop: 'generation',
      label: '世代',
      width: 90,
      formatter: (row: Api.Review.DoubtItem) => `第${row.generation}世`
    },
    {
      prop: 'reason',
      label: '存疑原因',
      minWidth: 200,
      formatter: (row: Api.Review.DoubtItem) => row.reason || '—'
    },
    {
      prop: 'operation',
      label: '操作',
      width: 200,
      fixed: 'right',
      formatter: (row: Api.Review.DoubtItem) =>
        h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
          h(
            ElButton,
            { size: 'small', type: 'success', plain: true, onClick: () => resolve(row, true) },
            () => '解除存疑'
          ),
          h(ElButton, { size: 'small', onClick: () => resolve(row, false) }, () => '补充备注')
        ])
    }
  ])

  const logColumns = computed<ColumnOption[]>(() => [
    { prop: 'createdAt', label: '时间', width: 160 },
    { prop: 'operator', label: '操作人', width: 120 },
    { prop: 'action', label: '动作', width: 110 },
    { prop: 'target', label: '对象', minWidth: 100 },
    { prop: 'remark', label: '备注', minWidth: 140 }
  ])

  const load = async () => {
    if (!genealogyId.value || isSimple.value) return
    loading.value = true
    try {
      const [p, d, s, personRes] = await Promise.all([
        fetchPendingReview(genealogyId.value),
        fetchDoubtList(genealogyId.value),
        fetchReviewState(genealogyId.value),
        fetchPersonList({
          genealogyId: genealogyId.value,
          current: 1,
          size: 1,
          scope: 'active',
          lineageScope: 'all'
        })
      ])
      pending.value = p
      doubts.value = d
      reviewState.value = s
      personTotal.value = personRes.total
      pendingPagination.total = p.length
      doubtPagination.total = d.length
      logPagination.total = s.logs.length
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const onTabChange = () => {
    // 切 Tab 时保持当前分页即可
  }

  const onPendingSizeChange = (size: number) => {
    pendingPagination.size = size
    pendingPagination.current = 1
  }
  const onPendingPageChange = (page: number) => {
    pendingPagination.current = page
  }
  const onDoubtSizeChange = (size: number) => {
    doubtPagination.size = size
    doubtPagination.current = 1
  }
  const onDoubtPageChange = (page: number) => {
    doubtPagination.current = page
  }
  const onLogSizeChange = (size: number) => {
    logPagination.size = size
    logPagination.current = 1
  }
  const onLogPageChange = (page: number) => {
    logPagination.current = page
  }

  const review = async (item: Api.Review.PendingItem, status: Api.Person.ReviewStatus) => {
    try {
      let note = ''
      if (status === 3) {
        const { value } = await ElMessageBox.prompt('请填写驳回整改说明', '驳回', {
          inputPattern: /.+/,
          inputErrorMessage: '请填写说明'
        })
        note = value
      }
      await fetchReviewPerson(genealogyId.value, item.targetId, status, note)
      ElMessage.success('已更新')
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '操作失败')
    }
  }

  const markDoubt = async (item: Api.Review.PendingItem) => {
    try {
      const { value } = await ElMessageBox.prompt('请填写存疑原因与考证备注', '标记存疑', {
        inputPattern: /.+/,
        inputErrorMessage: '存疑必须填写原因'
      })
      await fetchReviewPerson(genealogyId.value, item.targetId, 2, value)
      ElMessage.success('已标记存疑')
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '操作失败')
    }
  }

  const resolve = async (item: Api.Review.DoubtItem, pass: boolean) => {
    try {
      const { value } = await ElMessageBox.prompt(
        pass ? '确认解除存疑说明' : '补充考证备注',
        pass ? '解除存疑' : '补充备注',
        {
          inputValue: item.note || item.reason,
          inputPattern: /.+/,
          inputErrorMessage: '请填写备注'
        }
      )
      await fetchResolveDoubt(genealogyId.value, item.id, pass, value)
      ElMessage.success(pass ? '已解除存疑' : '已更新备注')
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '操作失败')
    }
  }

  const onFinalPass = async () => {
    finalizing.value = true
    try {
      await fetchFinalPass(genealogyId.value)
      ElMessage.success('终审放行成功，可推进至智能排版')
      load()
    } catch (e: any) {
      ElMessage.error(e?.message || '终审失败')
    } finally {
      finalizing.value = false
    }
  }

  watch(
    () => [genealogyId.value, isSimple.value] as const,
    () => {
      pendingPagination.current = 1
      doubtPagination.current = 1
      logPagination.current = 1
      load()
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .review-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      padding-top: 8px;
      padding-bottom: 12px;
    }
  }

  .review-tabs {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    height: 100%;

    :deep(.el-tabs__header) {
      flex-shrink: 0;
      margin-bottom: 12px;
    }

    :deep(.el-tabs__content) {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  /* Tabs + 顶栏会压缩可用高度；用 flex 吃满剩余空间，避免 ArtTable 高度 calc 把分页裁切 */
  .review-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .review-pane__table {
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
