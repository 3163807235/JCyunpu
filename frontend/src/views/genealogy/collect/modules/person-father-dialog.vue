<!-- 更改生父（父节点）· 关系图谱能力在列表行内快捷入口 -->
<template>
  <ElDialog
    :model-value="visible"
    title="更改父节点"
    width="480px"
    align-center
    destroy-on-close
    @close="emit('update:visible', false)"
  >
    <p v-if="person" class="text-sm text-g-600 mb-2">
      成员：{{ person.nameWei }}（{{ person.personNo }}）
    </p>
    <p class="text-xs text-g-500 mb-4">
      当前生父：{{
        currentFatherName || '未设置'
      }}。保存后将替换「生父」关系（嗣父等其他父系关系不受影响）。
    </p>
    <ElForm label-position="top">
      <ElFormItem label="新的生父" required>
        <ElSelect v-model="fatherId" filterable clearable class="w-full" placeholder="选择生父">
          <ElOption
            v-for="p in candidates"
            :key="p.id"
            :label="`${p.nameWei}（${p.personNo} · 第${p.generation}世）`"
            :value="p.id"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="submit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchCreateRelation, fetchDeleteRelation } from '@/api/relationship'

  defineOptions({ name: 'PersonFatherDialog' })

  const props = defineProps<{
    visible: boolean
    genealogyId: number
    person: Api.Person.Item | null
    persons: Api.Person.Item[]
    /** 当前人物的生父关系（可多条，一般一条） */
    fatherRelations: Api.Relationship.Item[]
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  const fatherId = ref<number>()
  const submitting = ref(false)

  const candidates = computed(() =>
    props.persons.filter((p) => p.id !== props.person?.id && p.gender !== 2)
  )

  const currentFatherName = computed(() => {
    const rel = props.fatherRelations[0]
    if (!rel) return ''
    const p = props.persons.find((x) => x.id === rel.toPersonId)
    return p?.nameWei || `#${rel.toPersonId}`
  })

  watch(
    () => props.visible,
    (v) => {
      if (v) {
        fatherId.value = props.fatherRelations[0]?.toPersonId
      }
    }
  )

  const submit = async () => {
    if (!props.person || !fatherId.value) {
      ElMessage.warning('请选择生父')
      return
    }
    if (props.fatherRelations.some((r) => r.toPersonId === fatherId.value)) {
      ElMessage.info('生父未变更')
      emit('update:visible', false)
      return
    }
    submitting.value = true
    try {
      for (const rel of props.fatherRelations) {
        await fetchDeleteRelation(rel.id)
      }
      await fetchCreateRelation({
        genealogyId: props.genealogyId,
        fromPersonId: props.person.id,
        toPersonId: fatherId.value,
        relType: 'father',
        remark: '列表更改父节点'
      })
      ElMessage.success('已更新生父')
      emit('success')
      emit('update:visible', false)
    } catch (e: any) {
      ElMessage.error(e?.message || '更新失败')
    } finally {
      submitting.value = false
    }
  }
</script>
