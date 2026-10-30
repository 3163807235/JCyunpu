<!-- 发布归档 · 产品文档 §3.4 页面 09；全高对齐 StageShell -->
<template>
  <div class="genealogy-archive art-full-height">
    <StageFlowActions class="shrink-0" :page-stage="5" />

    <div class="art-card p-5 flex-1 min-h-0 overflow-auto">
      <ElTabs v-model="activeTab">
        <ElTabPane label="归档操作" name="publish">
          <div class="flex items-center gap-1 mb-3 text-sm text-g-600">
            <span>发布归档</span>
            <PageTipIcon
              content="归档封存的是当期定稿快照；日常管理区活数据仍可继续维护。归档前须完成版式锁定。"
            />
          </div>
          <ElForm label-position="top" class="max-w-md">
            <ElFormItem label="公示范围">
              <ElRadioGroup v-model="privacy">
                <ElRadio :value="1">完全私密</ElRadio>
                <ElRadio :value="2">仅族内可见</ElRadio>
                <ElRadio :value="3">全网公开</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
            <ElButton type="primary" :loading="publishing" v-ripple @click="onPublish">
              执行发布归档
            </ElButton>
          </ElForm>
        </ElTabPane>

        <ElTabPane label="版本快照" name="snapshot">
          <ElEmpty v-if="!snapshots.length" description="暂无归档版本" />
          <ElTable v-else :data="snapshots" stripe>
            <ElTableColumn prop="batchNo" label="批次" width="70" />
            <ElTableColumn prop="title" label="标题" min-width="160" />
            <ElTableColumn label="版式" width="90">
              <template #default>牒记式</template>
            </ElTableColumn>
            <ElTableColumn prop="pageCount" label="页数" width="70" />
            <ElTableColumn prop="personCount" label="人物" width="70" />
            <ElTableColumn prop="createdAt" label="归档时间" width="160" />
            <ElTableColumn prop="summary" label="概况" min-width="180" show-overflow-tooltip />
          </ElTable>
        </ElTabPane>

        <ElTabPane label="版本对比" name="compare" disabled>
          <ElEmpty description="V1.5 上线" />
        </ElTabPane>

        <ElTabPane label="续修发起" name="renew" disabled>
          <ElEmpty description="V1.5 上线（数据模型已预留）" />
        </ElTabPane>
      </ElTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useRoute } from 'vue-router'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { fetchPublishArchive, fetchSnapshots } from '@/api/workflow'
  import StageFlowActions from '@/components/business/stage-flow-actions/index.vue'

  defineOptions({ name: 'GenealogyArchive' })

  useGenealogyContext()

  const route = useRoute()
  const genealogyStore = useGenealogyStore()
  const genealogyId = computed(() => Number(route.params.id) || 0)

  const activeTab = ref('publish')
  const publishing = ref(false)
  const privacy = ref<Api.Genealogy.Privacy>(2)
  const snapshots = ref<Api.Archive.Snapshot[]>([])

  const load = async () => {
    if (!genealogyId.value) return
    snapshots.value = await fetchSnapshots(genealogyId.value)
  }

  const onPublish = async () => {
    try {
      await ElMessageBox.confirm(
        '确认发布归档？归档后当前版本只读封存，不可回退编辑。',
        '发布归档',
        { type: 'warning', confirmButtonText: '确认归档' }
      )
      publishing.value = true
      const name = genealogyStore.currentGenealogyName || '族谱'
      const snap = await fetchPublishArchive(genealogyId.value, privacy.value, name)
      ElMessage.success(`已归档：${snap.title}`)
      activeTab.value = 'snapshot'
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '归档失败')
    } finally {
      publishing.value = false
    }
  }

  watch(genealogyId, load, { immediate: true })
</script>
