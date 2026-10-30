<!-- 创建 / 编辑族谱弹窗 · 产品文档 §3.4 页面 02 -->
<template>
  <ElDialog
    :model-value="visible"
    :title="isEdit ? '编辑族谱' : '创建族谱'"
    width="520px"
    align-center
    destroy-on-close
    @close="emit('update:visible', false)"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="族谱名称" prop="name">
        <ElInput
          v-model="form.name"
          maxlength="64"
          show-word-limit
          placeholder="如：颍川陈氏族谱"
        />
      </ElFormItem>
      <ElFormItem label="姓氏" prop="surname">
        <ElInput
          v-model="form.surname"
          maxlength="8"
          placeholder="本族姓，如：陈（录入人物时自动带入）"
        />
      </ElFormItem>
      <ElFormItem label="堂号" prop="hallName">
        <ElInput v-model="form.hallName" maxlength="32" placeholder="选填" />
      </ElFormItem>
      <ElFormItem label="始祖" prop="ancestor">
        <ElInput v-model="form.ancestor" maxlength="32" placeholder="选填" />
      </ElFormItem>
      <ElFormItem label="隐私权限" prop="privacy">
        <ElRadioGroup v-model="form.privacy">
          <ElRadio :value="1">完全私有</ElRadio>
          <ElRadio :value="2">族内可见</ElRadio>
          <ElRadio :value="3">全网公开</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem v-if="!isEdit" label="修谱模式" prop="mode">
        <ElRadioGroup v-model="form.mode">
          <ElRadio value="standard">标准模式（五步成谱）</ElRadio>
          <ElRadio value="simple">简易模式（快捷成谱）</ElRadio>
        </ElRadioGroup>
        <p class="mt-2 text-xs text-g-500">
          简易模式跳过校对；创建后可升级为标准模式，不可降级。
        </p>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" v-ripple @click="submit">
        {{ isEdit ? '保存' : '创建并进入' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { fetchCreateGenealogy, fetchUpdateGenealogy } from '@/api/genealogy'
  import { useGenealogyStore } from '@/store/modules/genealogy'

  defineOptions({ name: 'GenealogyFormDialog' })

  const props = defineProps<{
    visible: boolean
    editItem?: Api.Genealogy.Item | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: [Api.Genealogy.Item]
  }>()

  const genealogyStore = useGenealogyStore()
  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const isEdit = computed(() => !!props.editItem?.id)

  const form = reactive({
    name: '',
    surname: '',
    hallName: '',
    ancestor: '',
    privacy: 2 as Api.Genealogy.Privacy,
    mode: 'standard' as Api.Genealogy.Mode
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入族谱名称', trigger: 'blur' }],
    surname: [{ required: true, message: '请输入本族姓氏', trigger: 'blur' }],
    privacy: [{ required: true, message: '请选择隐私权限', trigger: 'change' }],
    mode: [{ required: true, message: '请选择修谱模式', trigger: 'change' }]
  }

  watch(
    () => props.visible,
    (open) => {
      if (!open) return
      if (props.editItem) {
        form.name = props.editItem.name
        form.surname = props.editItem.surname || ''
        form.hallName = props.editItem.hallName || ''
        form.ancestor = props.editItem.ancestor || ''
        form.privacy = props.editItem.privacy
        form.mode = props.editItem.mode
      } else {
        form.name = ''
        form.surname = ''
        form.hallName = ''
        form.ancestor = ''
        form.privacy = 2
        form.mode = 'standard'
      }
    }
  )

  const submit = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      if (isEdit.value && props.editItem) {
        const item = await fetchUpdateGenealogy(props.editItem.id, {
          name: form.name,
          surname: form.surname,
          hallName: form.hallName,
          ancestor: form.ancestor,
          privacy: form.privacy
        })
        if (genealogyStore.currentGenealogyId === item.id) {
          await genealogyStore.refreshFromServer(item.id)
        }
        ElMessage.success('已保存')
        emit('success', item)
        emit('update:visible', false)
      } else {
        const item = await fetchCreateGenealogy({
          name: form.name,
          surname: form.surname,
          hallName: form.hallName,
          ancestor: form.ancestor,
          privacy: form.privacy,
          mode: form.mode
        })
        let tip = '创建成功，已生成成员邀请码'
        try {
          const { fetchGenealogyInviteCode } = await import('@/api/member')
          const code = await fetchGenealogyInviteCode(item.id)
          tip = `创建成功，成员邀请码：${code.code}（可在权限设置中查看）`
        } catch {
          /* ignore */
        }
        ElMessage.success(tip)
        emit('success', item)
        emit('update:visible', false)
        await genealogyStore.enterGenealogy(item)
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  }
</script>
