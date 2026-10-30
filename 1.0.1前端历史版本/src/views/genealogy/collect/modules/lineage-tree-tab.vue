<!-- 世系图 · vue-family-tree-chart 宝塔吊线 · §3.4 关系图谱（折叠+分代/虚拟渲染） -->
<template>
  <div class="lineage-tree-tab h-full flex flex-col min-h-0">
    <div class="flex flex-wrap items-center gap-2 mb-3 shrink-0">
      <ElSpace wrap>
        <PageTipIcon
          content="宝塔吊线图：拖拽平移、滚轮缩放、点击折叠徽标展开/收起；悬停高亮祖先分支。"
        />
        <ElButton size="small" :disabled="!treeData" @click="chartRef?.fitView()">
          <ArtSvgIcon icon="ri:focus-3-line" class="mr-1" />
          适配视口
        </ElButton>
        <ElButton size="small" :disabled="!treeData" @click="chartRef?.expandAll()">
          <ArtSvgIcon icon="ri:node-tree" class="mr-1" />
          全部展开
        </ElButton>
        <ElButton size="small" :disabled="!treeData" @click="chartRef?.collapseAll()">
          <ArtSvgIcon icon="ri:collapse-diagonal-line" class="mr-1" />
          全部折叠
        </ElButton>
        <ElButton size="small" :disabled="!treeData" @click="chartRef?.toggleDirection()">
          <ArtSvgIcon icon="ri:arrow-left-right-line" class="mr-1" />
          左右镜像
        </ElButton>
        <ElButton size="small" :loading="loading" @click="load">
          <ArtSvgIcon icon="ri:refresh-line" class="mr-1" />
          刷新数据
        </ElButton>
      </ElSpace>
      <ElSelect v-model="spouseFormat" size="small" class="!w-28 ml-auto">
        <ElOption label="配偶全名" value="full" />
        <ElOption label="配偶某氏" value="surname" />
      </ElSelect>
    </div>

    <div class="lineage-chart-wrap art-card-sm relative flex-1 min-h-0 overflow-hidden">
      <div v-if="loading" class="absolute inset-0 flex-cc z-10 bg-box/60">
        <ArtSvgIcon icon="ri:loader-4-line" class="text-2xl text-theme animate-spin" />
      </div>

      <FamilyTreeChart
        v-if="treeData"
        ref="chartRef"
        class="lineage-family-chart"
        :data="treeData"
        v-model:collapsed="collapsed"
        :spouse-format="spouseFormat"
        :sp-gap="10"
        :show-rank="true"
        :show-inherit="true"
        :show-ruler="true"
        :enable-fold="true"
        :interactive="true"
        :hover-highlight="true"
        @layout-ready="onLayoutReady"
        @error="onChartError"
      >
        <template #empty>
          <ElEmpty description="暂无人物，请先在人员列表录入并维护父子关系" />
        </template>
        <template #error="{ error }">
          <ElEmpty :description="error?.message || '世系图数据异常'" />
        </template>
      </FamilyTreeChart>

      <ElEmpty
        v-else-if="!loading"
        class="absolute inset-0 flex-cc"
        description="暂无人物，请先在人员列表录入并维护父子关系"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { FamilyTreeChart } from 'vue-family-tree-chart'
  import type { FamilyNode, SpouseFormat } from 'vue-family-tree-chart'
  import 'vue-family-tree-chart/style.css'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchPersonList } from '@/api/person'
  import { fetchRelationList } from '@/api/relationship'
  import { buildFamilyTree } from '@/utils/genealogy/family-tree'

  defineOptions({ name: 'LineageTreeTab' })

  const props = defineProps<{ genealogyId: number }>()

  const loading = ref(false)
  const treeData = ref<FamilyNode | null>(null)
  const collapsed = ref<string[]>([])
  /** 默认全名，两任配偶并列时更易区分（某氏模式下「龚氏/邹氏」也支持多列） */
  const spouseFormat = ref<SpouseFormat>('full')
  const chartRef = ref<{
    fitView: () => void
    expandAll: () => void
    collapseAll: () => void
    toggleDirection: () => void
  } | null>(null)

  const onLayoutReady = () => {
    nextTick(() => chartRef.value?.fitView())
  }

  const onChartError = (err: Error) => {
    ElMessage.error(err?.message || '世系图渲染失败')
  }

  const load = async () => {
    loading.value = true
    try {
      const [personRes, rels] = await Promise.all([
        fetchPersonList({
          genealogyId: props.genealogyId,
          current: 1,
          size: 500,
          scope: 'active',
          lineageScope: 'all'
        }),
        fetchRelationList(props.genealogyId)
      ])
      collapsed.value = []
      treeData.value = buildFamilyTree(personRes.records, rels)
    } catch (e: any) {
      treeData.value = null
      ElMessage.error(e?.message || '加载世系图失败')
    } finally {
      loading.value = false
    }
  }

  watch(() => props.genealogyId, load, { immediate: true })
</script>

<style scoped lang="scss">
  .lineage-chart-wrap {
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
  }

  .lineage-family-chart {
    width: 100%;
    height: 100%;

    /* 贴近平台主题，保留组件吊线气质 */
    --ftc-bg: var(--default-box-color);
    --ftc-text-color: var(--art-gray-900);
    --ftc-edge-color: var(--art-gray-500);
    --ftc-edge-hl-color: var(--el-color-primary);
    --ftc-hint-color: var(--art-gray-500);
  }

  :deep(.ftc-root) {
    width: 100%;
    height: 100%;
  }
</style>
