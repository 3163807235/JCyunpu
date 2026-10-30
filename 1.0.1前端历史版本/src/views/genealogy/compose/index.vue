<!-- 内容编排 · v3.1.6 §3.4 页面 06 · 布局/分页对齐人员列表与校对页 -->
<template>
  <div class="genealogy-compose art-full-height">
    <StageFlowActions class="shrink-0" :page-stage="2" />

    <ElTag v-if="isSimple" class="mb-3 shrink-0 w-fit" size="small" type="info">
      简易模式：推进将跳过校对
    </ElTag>

    <ElCard class="art-table-card compose-main !mt-0" shadow="never">
      <ElTabs v-model="activeTab" class="compose-tabs">
        <ElTabPane label="谱书章节" name="chapters">
          <ChapterListTab v-if="genealogyId" :genealogy-id="genealogyId" />
        </ElTabPane>
        <ElTabPane label="世系规整" name="lineage">
          <LineageReviewTab v-if="genealogyId" :genealogy-id="genealogyId" />
        </ElTabPane>
        <ElTabPane label="初审检查" name="review">
          <InitialReviewTab v-if="genealogyId" :genealogy-id="genealogyId" />
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import StageFlowActions from '@/components/business/stage-flow-actions/index.vue'
  import ChapterListTab from './modules/chapter-list-tab.vue'
  import LineageReviewTab from './modules/lineage-review-tab.vue'
  import InitialReviewTab from './modules/initial-review-tab.vue'

  defineOptions({ name: 'GenealogyCompose' })

  useGenealogyContext()

  const route = useRoute()
  const genealogyStore = useGenealogyStore()
  const activeTab = ref('chapters')
  const genealogyId = computed(() => Number(route.params.id) || 0)
  const isSimple = computed(() => genealogyStore.currentMode === 'simple')
</script>

<style scoped lang="scss">
  .compose-main {
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

  .compose-tabs {
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
