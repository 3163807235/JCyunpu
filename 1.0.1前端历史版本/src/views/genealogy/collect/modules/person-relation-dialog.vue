<!-- 为指定人物添加亲属关系 · §3.4 关系绑定入口（与关系管理共用端点规范） -->
<template>
  <ElDialog
    :model-value="visible"
    title="添加关系"
    width="480px"
    align-center
    destroy-on-close
    @close="emit('update:visible', false)"
  >
    <p v-if="person" class="text-sm text-g-600 mb-3">
      关系主体：{{ person.nameWei }}（{{ person.personNo }} · 第{{ person.generation }}世）
    </p>
    <ElForm label-position="top">
      <ElFormItem label="关系类型" required>
        <div class="flex items-center gap-2 w-full">
          <ElSelect v-model="relType" class="flex-1">
            <ElOption v-for="(label, key) in relLabels" :key="key" :label="label" :value="key" />
          </ElSelect>
          <PageTipIcon
            v-if="isSpouseRelType(relType)"
            mode="popover"
            title="新建配偶档案请到「编辑人物 → 婚配」"
            content="此处仅关联已有人物；不会自动创建配偶档案。备注空时按对象姓名生成「配|姓|名」。"
          />
        </div>
      </ElFormItem>
      <ElFormItem :label="toFieldLabel" required>
        <ElSelect v-model="toId" filterable class="w-full" placeholder="选择人物">
          <ElOption
            v-for="p in candidates"
            :key="p.id"
            :label="`${p.nameWei}（${p.personNo} · 第${p.generation}世）`"
            :value="p.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="remark"
          maxlength="200"
          :placeholder="isSpouseRelType(relType) ? '配|姓|名（可空）' : '备注'"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="submit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchCreateRelation } from '@/api/relationship'
  import { REL_TYPE_LABELS } from '@/mock/relationship'
  import {
    buildSpouseRemarkFromPerson,
    isParentRelType,
    isSpouseRelType,
    normalizeRelationEndpoints
  } from '@/utils/genealogy/relation-endpoints'

  defineOptions({ name: 'PersonRelationDialog' })

  const props = defineProps<{
    visible: boolean
    genealogyId: number
    person: Api.Person.Item | null
    persons: Api.Person.Item[]
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  const relLabels = REL_TYPE_LABELS
  const relType = ref<Api.Relationship.RelType>('father')
  const toId = ref<number>()
  const remark = ref('')
  const submitting = ref(false)

  const candidates = computed(() => props.persons.filter((p) => p.id !== props.person?.id))

  const toFieldLabel = computed(() => {
    if (isParentRelType(relType.value)) return '对象（父/母）'
    if (isSpouseRelType(relType.value)) return '对象（配偶）'
    return '关系对象'
  })

  watch(
    () => props.visible,
    (v) => {
      if (v) {
        relType.value = 'father'
        toId.value = undefined
        remark.value = ''
      }
    }
  )

  const submit = async () => {
    if (!props.person || !toId.value) {
      ElMessage.warning('请选择关系对象')
      return
    }
    submitting.value = true
    try {
      // 主体固定为当前人物时：父/母类已符合 from=子；配偶类仍可能需对调为男主系
      const normalized = normalizeRelationEndpoints(
        props.person.id,
        toId.value,
        relType.value,
        props.persons
      )
      let finalRemark = remark.value.trim()
      if (isSpouseRelType(relType.value) && !finalRemark) {
        const spouseId =
          normalized.fromPersonId === props.person.id
            ? normalized.toPersonId
            : normalized.fromPersonId
        finalRemark = buildSpouseRemarkFromPerson(props.persons.find((p) => p.id === spouseId))
      }
      await fetchCreateRelation({
        genealogyId: props.genealogyId,
        fromPersonId: normalized.fromPersonId,
        toPersonId: normalized.toPersonId,
        relType: relType.value,
        remark: finalRemark
      })
      if (normalized.swapped && normalized.tip) {
        ElMessage.success(`已添加关系（${normalized.tip}）`)
      } else {
        ElMessage.success('已添加关系')
      }
      emit('success')
      emit('update:visible', false)
    } catch (e: any) {
      ElMessage.error(e?.message || '添加失败')
    } finally {
      submitting.value = false
    }
  }
</script>
