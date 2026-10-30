<!-- 输入族谱邀请码加入 · 成员专题 §7.2 / §7.3；成为成员（只读），非协作 -->
<template>
  <ElDialog
    :model-value="visible"
    title="邀请码加入族谱"
    width="440px"
    align-center
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
    @closed="reset"
  >
    <p class="text-xs text-g-500 mb-3">
      填写族谱邀请码后成为该族谱<strong>成员（只读）</strong>。采编等协作权限须由拥有者在「角色管理」另行邀请。
    </p>
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="族谱邀请码" prop="code">
        <ElInput
          v-model="form.code"
          maxlength="16"
          placeholder="请输入邀请码，如 YCDEMO01"
          @keyup.enter="onPreview"
        />
      </ElFormItem>
    </ElForm>

    <div v-if="preview" class="rounded-lg border border-g-200 bg-g-50 px-3 py-2.5 text-sm">
      <p class="font-medium">{{ preview.name }}</p>
      <p class="text-xs text-g-500 mt-1">
        姓氏 {{ preview.surname || '—' }} · 堂号 {{ preview.hallName || '未设' }}
      </p>
    </div>

    <template #footer>
      <ElButton @click="emit('update:visible', false)">取消</ElButton>
      <ElButton v-if="!preview" type="primary" :loading="loading" v-ripple @click="onPreview">
        预览
      </ElButton>
      <ElButton v-else type="primary" :loading="loading" v-ripple @click="onJoin">
        确认加入
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { fetchJoinGenealogyByCode, fetchPreviewInviteCode } from '@/api/member'
  import { isValidInviteCodeFormat } from '@/utils/genealogy/invite-code'

  defineOptions({ name: 'JoinGenealogyDialog' })

  defineProps<{ visible: boolean }>()
  const emit = defineEmits<{
    'update:visible': [boolean]
    success: [item: Api.Genealogy.Item]
  }>()

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const preview = ref<Api.GenealogyMember.InvitePreview | null>(null)
  const form = reactive({ code: '' })

  const rules: FormRules = {
    code: [
      { required: true, message: '请输入族谱邀请码', trigger: 'blur' },
      {
        validator: (_r, v, cb) => {
          if (!v || !isValidInviteCodeFormat(String(v))) {
            cb(new Error('邀请码格式不正确（6–16 位字母数字）'))
          } else cb()
        },
        trigger: 'blur'
      }
    ]
  }

  const reset = () => {
    form.code = ''
    preview.value = null
    formRef.value?.resetFields()
  }

  const onPreview = async () => {
    const ok = await formRef.value?.validate().catch(() => false)
    if (!ok) return
    loading.value = true
    try {
      preview.value = await fetchPreviewInviteCode(form.code.trim())
    } catch (e: any) {
      preview.value = null
      ElMessage.error(e?.message || '预览失败')
    } finally {
      loading.value = false
    }
  }

  const onJoin = async () => {
    loading.value = true
    try {
      const item = await fetchJoinGenealogyByCode({ code: form.code.trim() })
      ElMessage.success(`已加入「${item.name}」（成员 · 只读）`)
      emit('update:visible', false)
      emit('success', item)
    } catch (e: any) {
      ElMessage.error(e?.message || '加入失败')
    } finally {
      loading.value = false
    }
  }
</script>
