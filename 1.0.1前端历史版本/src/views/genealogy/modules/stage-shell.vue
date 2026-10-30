<!-- 阶段壳页通用布局：全高 + 内容区内滚动（对齐人员列表） -->
<template>
  <div class="genealogy-stage-shell art-full-height">
    <StageFlowActions v-if="pageStage" class="shrink-0" :page-stage="pageStage" />

    <div class="stage-shell-body art-card p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
      <ElTabs v-if="tabs.length" v-model="activeTab" class="stage-shell-tabs">
        <ElTabPane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <div class="h-full min-h-0 overflow-auto">
            <slot :name="`tab-${tab.name}`">
              <ElEmpty :description="tab.empty || `${tab.label}功能将在后续迭代落地`" />
            </slot>
          </div>
        </ElTabPane>
      </ElTabs>
      <div v-else class="flex-1 min-h-0 overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import StageFlowActions from '@/components/business/stage-flow-actions/index.vue'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'

  defineOptions({ name: 'GenealogyStageShell' })

  interface TabItem {
    name: string
    label: string
    empty?: string
  }

  const props = defineProps<{
    /** @deprecated 页头标题已移除，保留 props 兼容旧调用 */
    title?: string
    /** @deprecated 页头说明已移除 */
    description?: string
    /** @deprecated 页头徽章已移除 */
    badge?: string
    tabs?: TabItem[]
    pageStage?: Api.Genealogy.Stage
  }>()

  useGenealogyContext()

  const tabs = computed(() => props.tabs || [])
  const activeTab = ref(tabs.value[0]?.name || '')

  watch(
    tabs,
    (list) => {
      if (list.length && !list.some((t) => t.name === activeTab.value)) {
        activeTab.value = list[0].name
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .genealogy-stage-shell {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .stage-shell-body {
    margin-bottom: 0;
  }

  .stage-shell-tabs {
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
</style>
