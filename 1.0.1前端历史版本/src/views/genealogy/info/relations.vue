<!-- 信息管理 · 关系图谱 · v3.1.6 §3.4：布局对齐人员列表（art-full-height + art-table-card） -->
<template>
  <div v-loading="!genealogyId" class="genealogy-info-relations art-full-height">
    <ElCard v-if="genealogyId" class="art-table-card relations-main !mt-0" shadow="never">
      <ElTabs v-model="activeTab" class="relations-tabs">
        <ElTabPane label="关系管理" name="list" class="relations-pane">
          <RelationListTab :genealogy-id="genealogyId" />
        </ElTabPane>
        <ElTabPane label="世系图" name="tree" class="relations-pane" lazy>
          <LineageTreeTab v-if="activeTab === 'tree'" :genealogy-id="genealogyId" />
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import RelationListTab from '../collect/modules/relation-list-tab.vue'
  import LineageTreeTab from '../collect/modules/lineage-tree-tab.vue'

  defineOptions({ name: 'GenealogyInfoRelations' })
  useGenealogyContext()

  const route = useRoute()
  const activeTab = ref('list')
  const genealogyId = computed(() => Number(route.params.id) || 0)
</script>

<style scoped lang="scss">
  .relations-main {
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
    }
  }

  .relations-tabs {
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
