<!-- 回收站抽屉 · 产品文档 §3.4 页面 02 -->
<template>
  <ElDrawer
    :model-value="visible"
    title="回收站"
    size="420px"
    @close="emit('update:visible', false)"
  >
    <p class="text-sm text-g-500 mb-4">
      删除后保留 30 天，期间可全额恢复；彻底删除需验证码确认且不可恢复。
    </p>

    <ElEmpty v-if="!list.length" description="回收站为空" />

    <div v-for="item in list" :key="item.id" class="art-card-sm p-4 mb-3">
      <div class="flex-cb gap-2">
        <div class="min-w-0">
          <p class="font-medium truncate">{{ item.name }}</p>
          <p class="text-xs text-g-500 mt-1">删除于 {{ item.deletedAt }}</p>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <ElButton
          size="small"
          type="primary"
          plain
          :loading="busyId === item.id"
          @click="onRestore(item)"
        >
          恢复
        </ElButton>
        <ElButton
          size="small"
          type="danger"
          plain
          :loading="busyId === item.id"
          @click="onPurge(item)"
        >
          彻底删除
        </ElButton>
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchGenealogyList, fetchPurgeGenealogy, fetchRestoreGenealogy } from '@/api/genealogy'

  defineOptions({ name: 'GenealogyTrashDrawer' })

  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits<{
    'update:visible': [boolean]
    restored: []
  }>()

  const list = ref<Api.Genealogy.Item[]>([])
  const busyId = ref<number | null>(null)

  const load = async () => {
    const res = await fetchGenealogyList({ scope: 'trash', current: 1, size: 50 })
    list.value = res.records
  }

  watch(
    () => props.visible,
    (open) => {
      if (open) load()
    }
  )

  const onRestore = async (item: Api.Genealogy.Item) => {
    busyId.value = item.id
    try {
      await fetchRestoreGenealogy(item.id)
      ElMessage.success('已恢复')
      emit('restored')
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '恢复失败')
    } finally {
      busyId.value = null
    }
  }

  const onPurge = async (item: Api.Genealogy.Item) => {
    try {
      const { value } = await ElMessageBox.prompt(
        `彻底删除「${item.name}」后不可恢复。请输入验证码确认（Mock：123456）`,
        '彻底删除',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          inputPattern: /^\d{4,6}$/,
          inputErrorMessage: '请输入验证码',
          type: 'warning'
        }
      )
      busyId.value = item.id
      await fetchPurgeGenealogy(item.id, value)
      ElMessage.success('已彻底删除')
      await load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    } finally {
      busyId.value = null
    }
  }
</script>
