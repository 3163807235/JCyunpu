<!-- 智能排版 · v3.1.6 §3.4 · MVP 仅牒记式；全高对齐 StageShell -->
<template>
  <div class="genealogy-layout art-full-height">
    <StageFlowActions class="shrink-0" :page-stage="4" />

    <div class="flex-cb flex-wrap gap-2 mb-3 shrink-0">
      <div class="flex items-center gap-2 flex-wrap">
        <ElTag :type="layout.locked ? 'success' : 'warning'" size="small">
          {{ layout.locked ? '版式已锁定' : '未锁定' }}
        </ElTag>
        <ElTag v-if="isDirty" type="danger" size="small">活数据已变更</ElTag>
      </div>
    </div>

    <ElAlert
      v-if="isDirty"
      class="mb-3! shrink-0"
      type="error"
      :closable="false"
      title="活数据已变更，排版需刷新。禁止 PDF 导出，直至确认纳入或回校对终审。"
    >
      <template #default>
        <div class="mt-2 flex flex-wrap gap-2">
          <ElButton size="small" @click="onRefreshSync">刷新同步</ElButton>
          <ElButton
            v-if="isSimple"
            size="small"
            type="primary"
            :loading="confirming"
            @click="onSimpleConfirm"
          >
            确认纳入（简易模式）
          </ElButton>
          <ElButton v-else size="small" type="primary" @click="goReview"> 回校对重新终审 </ElButton>
        </div>
      </template>
    </ElAlert>

    <div class="art-card p-5 flex-1 min-h-0 overflow-auto">
      <ElTabs v-model="activeTab">
        <ElTabPane label="智能排版" name="smart">
          <div class="flex flex-wrap gap-2 mb-4">
            <ElRadioGroup v-model="selectedType" :disabled="layout.locked" @change="onTypeChange">
              <ElRadioButton value="dieji">牒记式</ElRadioButton>
              <ElRadioButton value="sushi" disabled>苏式（Spike）</ElRadioButton>
              <ElRadioButton value="oushi" disabled>欧式（V1.5）</ElRadioButton>
              <ElRadioButton value="baota" disabled>宝塔式（V1.5）</ElRadioButton>
            </ElRadioGroup>
            <ElButton @click="loadPreview">刷新预览</ElButton>
          </div>

          <ElEmpty v-if="!entries.length" description="暂无人物，请先在信息管理中录入" />
          <div
            v-else
            class="dieji-preview max-h-125 overflow-auto border border-g-200 rounded-lg p-5 bg-[#faf8f5]"
            :class="{ 'outline-2 outline-danger/40': isDirty }"
          >
            <template v-for="(group, gen) in groupedEntries" :key="gen">
              <h3 class="text-base font-semibold mt-4 mb-2 first:mt-0">第{{ gen }}世</h3>
              <div v-for="(entry, idx) in group" :key="idx" class="mb-3">
                <p class="font-medium">{{ entry.title }}</p>
                <p class="text-sm text-g-700 mt-1 indent-[2em] leading-relaxed">{{ entry.body }}</p>
              </div>
            </template>
          </div>
        </ElTabPane>

        <ElTabPane label="版式锁定" name="lock">
          <div class="flex items-center gap-1 mb-3 text-sm text-g-600">
            <span>版式锁定</span>
            <PageTipIcon
              content="锁定后禁止内容修改；若需改内容须解锁并回退至校对（简易模式可在本页确认纳入）。"
            />
          </div>
          <p class="text-sm text-g-600 mb-2">预估页数：{{ layout.pageCount }}</p>
          <p class="text-sm text-g-600 mb-4">锁定时间：{{ layout.lockedAt || '—' }}</p>
          <div class="flex gap-2">
            <ElButton
              type="primary"
              :disabled="layout.locked || subBlocked"
              :loading="locking"
              v-ripple
              @click="onLock"
            >
              锁定版式
            </ElButton>
            <ElButton
              type="danger"
              plain
              :disabled="!layout.locked"
              :loading="locking"
              @click="onUnlock"
            >
              解锁并回退校对态
            </ElButton>
          </div>
        </ElTabPane>

        <ElTabPane label="PDF导出" name="pdf">
          <ElAlert
            v-if="subBlocked"
            class="mb-4!"
            type="error"
            :closable="false"
            :title="subBlockReason"
          >
            <ElButton
              class="mt-2"
              type="primary"
              size="small"
              @click="mittBus.emit('openSubscription', 'purchase')"
            >
              前往订阅中心
            </ElButton>
          </ElAlert>
          <div v-if="!subBlocked" class="flex items-center gap-1 mb-3 text-sm text-g-600">
            <span>导出须知</span>
            <PageTipIcon content="活数据变更或未校对通过时禁止导出；试用套餐仅预览不可印刷导出。" />
          </div>
          <ElButton
            type="primary"
            :disabled="!layout.locked || isDirty || exportBlocked || subBlocked"
            :loading="creatingPdf"
            v-ripple
            @click="onCreatePdf"
          >
            生成印刷版 PDF
          </ElButton>
          <p v-if="exportBlocked" class="mt-2 text-xs text-warning">
            存在未审核或待整改人物，请先校对（标准）或确认纳入（简易）
          </p>

          <ElTable class="mt-4" :data="layout.pdfJobs" stripe>
            <ElTableColumn prop="id" label="任务ID" width="120" />
            <ElTableColumn prop="createdAt" label="创建时间" width="160" />
            <ElTableColumn label="进度" min-width="180">
              <template #default="{ row }">
                <ElProgress
                  :percentage="row.progress"
                  :status="row.status === 'done' ? 'success' : undefined"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="90">
              <template #default="{ row }">
                {{ row.status === 'done' ? '完成' : row.status === 'failed' ? '失败' : '生成中' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120">
              <template #default="{ row }">
                <ElButton v-if="row.status === 'done'" link type="primary" @click="onDownload(row)">
                  下载
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useRoute, useRouter } from 'vue-router'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import {
    fetchCreatePdfJob,
    fetchDiejiPreview,
    fetchLayoutState,
    fetchLockLayout,
    fetchSetLayoutType,
    fetchUnlockLayout
  } from '@/api/workflow'
  import { mockSetLayoutDirty } from '@/mock/genealogy'
  import { hasBlockingReviewStatus, markAllPersonsReviewed } from '@/mock/person'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'
  import { mittBus } from '@/utils/sys'
  import StageFlowActions from '@/components/business/stage-flow-actions/index.vue'
  import type { LayoutState } from '@/mock/workflow'

  defineOptions({ name: 'GenealogyLayout' })

  useGenealogyContext()

  const route = useRoute()
  const router = useRouter()
  const genealogyStore = useGenealogyStore()
  const genealogyId = computed(() => Number(route.params.id) || 0)
  const isSimple = computed(() => genealogyStore.currentMode === 'simple')
  const isDirty = computed(() => (genealogyStore.current?.layoutDirty ?? 0) === 1)
  const exportBlocked = ref(false)
  const {
    expired,
    quotaExhausted,
    canExportPdf,
    summary,
    refresh: refreshSubscription
  } = useSubscriptionGuard()

  const subBlocked = computed(() => expired.value || quotaExhausted.value || !canExportPdf.value)
  const subBlockReason = computed(() => {
    if (expired.value) return '订阅已过期，禁止排版定稿与 PDF 导出，请续费。'
    if (quotaExhausted.value) return '人物额度已用尽，禁止排版定稿与 PDF 导出，请扩容。'
    if (summary.value && !summary.value.allowPdfExport) {
      return '当前试用套餐仅支持预览，升级基础/专业套餐后可导出印刷版 PDF。'
    }
    return '当前无法导出，请检查订阅状态。'
  })

  const activeTab = ref('smart')
  const locking = ref(false)
  const creatingPdf = ref(false)
  const confirming = ref(false)
  const selectedType = ref<Api.Layout.LayoutType>('dieji')
  const entries = ref<Api.Layout.DiejiEntry[]>([])
  const layout = ref<LayoutState>({
    layoutType: 'dieji',
    locked: false,
    pageCount: 0,
    pdfJobs: []
  })

  const groupedEntries = computed(() => {
    const map: Record<number, Api.Layout.DiejiEntry[]> = {}
    entries.value.forEach((e) => {
      if (!map[e.generation]) map[e.generation] = []
      map[e.generation].push(e)
    })
    return map
  })

  const refreshExportGate = () => {
    if (!genealogyId.value) {
      exportBlocked.value = false
      return
    }
    exportBlocked.value = hasBlockingReviewStatus(genealogyId.value)
  }

  const load = async () => {
    if (!genealogyId.value) return
    await genealogyStore.refreshFromServer(genealogyId.value)
    layout.value = await fetchLayoutState(genealogyId.value)
    selectedType.value = layout.value.layoutType
    await loadPreview()
    refreshExportGate()
  }

  const loadPreview = async () => {
    entries.value = await fetchDiejiPreview(genealogyId.value)
  }

  const onTypeChange = async (val: string | number | boolean | undefined) => {
    try {
      await fetchSetLayoutType(genealogyId.value, val as Api.Layout.LayoutType)
      ElMessage.success('已切换版式')
      load()
    } catch (e: any) {
      selectedType.value = 'dieji'
      ElMessage.error(e?.message || '切换失败')
    }
  }

  const onLock = async () => {
    locking.value = true
    try {
      layout.value = await fetchLockLayout(genealogyId.value)
      ElMessage.success('版式已锁定，可导出 PDF 或推进归档')
    } catch (e: any) {
      ElMessage.error(e?.message || '锁定失败')
    } finally {
      locking.value = false
    }
  }

  const onUnlock = async () => {
    try {
      await ElMessageBox.confirm(
        '解锁将取消终审放行状态，标准模式需重新终审。是否继续？',
        '解锁版式',
        { type: 'warning' }
      )
      locking.value = true
      layout.value = await fetchUnlockLayout(genealogyId.value)
      if (genealogyStore.currentMode === 'standard') {
        await genealogyStore.setStage(3, true)
      }
      ElMessage.success('已解锁')
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '解锁失败')
    } finally {
      locking.value = false
    }
  }

  const onRefreshSync = async () => {
    await loadPreview()
    ElMessage.success('已重新拉取活数据预览（脏标记需确认纳入或回校对后方可清除）')
  }

  const onSimpleConfirm = async () => {
    confirming.value = true
    try {
      markAllPersonsReviewed(genealogyId.value)
      mockSetLayoutDirty(genealogyId.value, 0)
      await genealogyStore.refreshFromServer(genealogyId.value)
      refreshExportGate()
      ElMessage.success('已确认纳入，可导出 PDF')
    } catch (e: any) {
      ElMessage.error(e?.message || '确认失败')
    } finally {
      confirming.value = false
    }
  }

  const goReview = () => {
    router.push(`/g/${genealogyId.value}/review`)
  }

  const onCreatePdf = async () => {
    if (subBlocked.value) {
      ElMessage.warning(subBlockReason.value)
      return
    }
    if (isDirty.value) {
      ElMessage.warning('活数据已变更，请先确认纳入或回校对')
      return
    }
    if (hasBlockingReviewStatus(genealogyId.value)) {
      ElMessage.warning('存在未审核或待整改人物')
      return
    }
    creatingPdf.value = true
    try {
      await fetchCreatePdfJob(genealogyId.value)
      ElMessage.success('已创建 PDF 任务')
      const poll = setInterval(async () => {
        layout.value = await fetchLayoutState(genealogyId.value)
        const latest = layout.value.pdfJobs[0]
        if (!latest || latest.status === 'done' || latest.status === 'failed') {
          clearInterval(poll)
        }
      }, 500)
    } catch (e: any) {
      ElMessage.error(e?.message || '创建失败')
    } finally {
      creatingPdf.value = false
    }
  }

  const onDownload = (row: Api.Layout.PdfJob) => {
    ElMessage.success(`Mock 下载：${row.downloadUrl || row.id}`)
  }

  watch(genealogyId, load, { immediate: true })
  onMounted(refreshSubscription)
</script>
