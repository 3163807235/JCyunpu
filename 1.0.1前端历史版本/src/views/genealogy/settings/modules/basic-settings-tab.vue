<!-- 基础设置 · §3.4 页面 12 / 创建弹窗字段对齐 -->
<template>
  <div v-loading="loading" class="basic-settings-tab max-w-xl">
    <div class="flex items-center gap-1 mb-3 text-sm text-g-600">
      <span>基础信息</span>
      <PageTipIcon
        content="仅拥有者可修改族谱基础信息。修谱模式仅支持简易 → 标准升级，不可降级。"
      />
    </div>

    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="族谱名称" prop="name">
        <ElInput
          v-model="form.name"
          maxlength="64"
          show-word-limit
          placeholder="如：颍川陈氏族谱"
          :disabled="!canEdit"
        />
      </ElFormItem>
      <ElFormItem label="姓氏" prop="surname">
        <ElInput
          v-model="form.surname"
          maxlength="8"
          placeholder="本族姓，如：陈"
          :disabled="!canEdit"
        />
      </ElFormItem>
      <ElFormItem label="堂号" prop="hallName">
        <ElInput v-model="form.hallName" maxlength="32" placeholder="选填" :disabled="!canEdit" />
      </ElFormItem>
      <ElFormItem label="始祖" prop="ancestor">
        <ElInput v-model="form.ancestor" maxlength="32" placeholder="选填" :disabled="!canEdit" />
      </ElFormItem>
      <ElFormItem label="修谱模式">
        <div class="flex flex-wrap items-center gap-3">
          <ElTag :type="form.mode === 'standard' ? 'primary' : 'info'" effect="plain">
            {{ form.mode === 'standard' ? '标准模式（五步成谱）' : '简易模式（快捷成谱）' }}
          </ElTag>
          <ElButton
            v-if="form.mode === 'simple'"
            type="primary"
            plain
            size="small"
            :disabled="!canEdit"
            :loading="upgrading"
            v-ripple
            @click="upgradeMode"
          >
            升级为标准模式
          </ElButton>
        </div>
      </ElFormItem>
    </ElForm>

    <div class="mt-2">
      <ElButton type="primary" :loading="saving" :disabled="!canEdit" v-ripple @click="save">
        保存基础设置
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { useRoute } from 'vue-router'
  import { fetchGenealogyDetail, fetchUpdateGenealogy } from '@/api/genealogy'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'

  defineOptions({ name: 'BasicSettingsTab' })

  const route = useRoute()
  const genealogyStore = useGenealogyStore()
  const { canEdit, refresh: refreshSub } = useSubscriptionGuard()

  const genealogyId = computed(() => Number(route.params.id))
  const loading = ref(false)
  const saving = ref(false)
  const upgrading = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive({
    name: '',
    surname: '',
    hallName: '',
    ancestor: '',
    mode: 'standard' as Api.Genealogy.Mode
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入族谱名称', trigger: 'blur' }],
    surname: [{ required: true, message: '请输入本族姓氏', trigger: 'blur' }]
  }

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      await refreshSub()
      const item = await fetchGenealogyDetail(genealogyId.value)
      form.name = item.name
      form.surname = item.surname || ''
      form.hallName = item.hallName || ''
      form.ancestor = item.ancestor || ''
      form.mode = item.mode
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const save = async () => {
    const ok = await formRef.value?.validate().catch(() => false)
    if (!ok) return
    saving.value = true
    try {
      const item = await fetchUpdateGenealogy(genealogyId.value, {
        name: form.name.trim(),
        surname: form.surname.trim(),
        hallName: form.hallName.trim(),
        ancestor: form.ancestor.trim()
      })
      await genealogyStore.refreshFromServer(item.id)
      ElMessage.success('基础设置已保存')
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  const upgradeMode = async () => {
    try {
      await ElMessageBox.confirm(
        '升级为标准模式后将启用校对阶段，且不可再降回简易模式。是否继续？',
        '升级修谱模式',
        { type: 'warning', confirmButtonText: '升级', cancelButtonText: '取消' }
      )
      upgrading.value = true
      const item = await fetchUpdateGenealogy(genealogyId.value, { mode: 'standard' })
      form.mode = item.mode
      await genealogyStore.refreshFromServer(item.id)
      ElMessage.success('已升级为标准模式')
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '升级失败')
    } finally {
      upgrading.value = false
    }
  }

  watch(genealogyId, load, { immediate: true })
</script>
