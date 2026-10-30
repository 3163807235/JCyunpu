<template>
  <ElDrawer
    :model-value="visible"
    title="人物回收站"
    size="480px"
    @close="emit('update:visible', false)"
  >
    <p class="text-sm text-g-500 mb-4">
      回收站人物仍占用额度；彻底删除后释放额度。恢复不额外占用。
    </p>
    <ElEmpty v-if="!list.length" description="回收站为空" />
    <div v-for="item in list" :key="item.id" class="art-card-sm p-3 mb-3">
      <div class="min-w-0">
        <p class="font-medium truncate">{{ item.nameWei }} · 第{{ item.generation }}世</p>
        <p class="text-xs text-g-500 mt-1">删除于 {{ item.deletedAt }}</p>
      </div>
      <div class="flex gap-2 mt-2">
        <ElButton size="small" type="primary" plain @click="onRestore(item)">恢复</ElButton>
        <ElButton size="small" type="danger" plain @click="onPurge(item)">彻底删除</ElButton>
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchPersonList, fetchPurgePerson, fetchRestorePerson } from '@/api/person'
  import { fetchSubscriptionSummary } from '@/api/genealogy'

  defineOptions({ name: 'PersonTrashDrawer' })

  const props = defineProps<{ visible: boolean; genealogyId: number }>()
  const emit = defineEmits<{ 'update:visible': [boolean]; changed: [] }>()

  const list = ref<Api.Person.Item[]>([])

  const load = async () => {
    const res = await fetchPersonList({
      genealogyId: props.genealogyId,
      scope: 'trash',
      current: 1,
      size: 100,
      lineageScope: 'all'
    })
    list.value = res.records
  }

  watch(
    () => props.visible,
    (v) => v && load()
  )

  const onRestore = async (item: Api.Person.Item) => {
    try {
      const summary = await fetchSubscriptionSummary()
      await fetchRestorePerson(item.id, summary.personLimit)
      ElMessage.success('已恢复')
      emit('changed')
      load()
    } catch (e: any) {
      ElMessage.error(e?.message || '恢复失败')
    }
  }

  const onPurge = async (item: Api.Person.Item) => {
    try {
      await ElMessageBox.confirm(
        `彻底删除「${item.nameWei}」后不可恢复，并释放额度。`,
        '彻底删除',
        {
          type: 'warning'
        }
      )
      await fetchPurgePerson(item.id)
      ElMessage.success('已彻底删除')
      emit('changed')
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }
</script>
