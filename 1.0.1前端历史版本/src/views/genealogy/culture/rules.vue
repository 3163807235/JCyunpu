<!-- 家族文化 · 家规家训 · §3.4 页面 10 Tab1 -->
<template>
  <StageShell
    title="家规家训"
    description="以结构化条目管理祖训/家规/家训；智能排版时自动生成家训篇章"
    :tabs="[]"
  >
    <div v-loading="loading">
      <div class="flex-cb flex-wrap gap-2 mb-4">
        <p class="text-sm text-g-500 inline-flex items-center gap-1">
          共 {{ list.length }} 条
          <PageTipIcon
            content="额度用尽仍可编辑已有条目；订阅过期后仅只读。条目归属族谱级，续修可继承增补。"
          />
        </p>
        <ElButton type="primary" :disabled="!canEdit" v-ripple @click="openCreate">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新增条目
        </ElButton>
      </div>

      <ElTable :data="list" stripe>
        <ElTableColumn prop="sortOrder" label="序" width="60" />
        <ElTableColumn label="分类" width="100">
          <template #default="{ row }">
            <ElTag size="small" type="info">{{ RULE_CATEGORY_LABELS[row.category] }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="title" label="标题" min-width="140" />
        <ElTableColumn prop="origin" label="出处" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.origin || '—' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="updatedAt" label="更新时间" width="170" />
        <ElTableColumn label="操作" width="220" fixed="right">
          <template #default="{ row, $index }">
            <ElButton link type="primary" :disabled="!canEdit" @click="openEdit(row)"
              >编辑</ElButton
            >
            <ElButton link :disabled="!canEdit || $index === 0" @click="move(row, -1)"
              >上移</ElButton
            >
            <ElButton link :disabled="!canEdit || $index === list.length - 1" @click="move(row, 1)">
              下移
            </ElButton>
            <ElButton link type="danger" :disabled="!canEdit" @click="onDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="!loading && !list.length" description="暂无家规家训，点击新增开始录入" />
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="editId ? '编辑条目' : '新增条目'"
      width="720px"
      align-center
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
        <ElFormItem label="分类" prop="category">
          <ElSelect v-model="form.category" class="w-full">
            <ElOption
              v-for="(label, key) in RULE_CATEGORY_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标题" prop="title">
          <ElInput
            v-model="form.title"
            maxlength="128"
            show-word-limit
            placeholder="如：勤俭持家"
          />
        </ElFormItem>
        <ElFormItem label="出处">
          <ElInput v-model="form.origin" maxlength="256" placeholder="如：三世祖某公立" />
        </ElFormItem>
        <ElFormItem label="内容" prop="content">
          <ArtWangEditor v-model="form.content" height="260px" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" v-ripple @click="save">保存</ElButton>
      </template>
    </ElDialog>
  </StageShell>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { useRoute } from 'vue-router'
  import {
    RULE_CATEGORY_LABELS,
    fetchCreateFamilyRule,
    fetchDeleteFamilyRule,
    fetchFamilyRuleList,
    fetchReorderFamilyRules,
    fetchUpdateFamilyRule
  } from '@/api/culture'
  import { useUserStore } from '@/store/modules/user'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'
  import StageShell from '../modules/stage-shell.vue'

  defineOptions({ name: 'GenealogyCultureRules' })

  const route = useRoute()
  const userStore = useUserStore()
  const { canEdit, refresh: refreshSub } = useSubscriptionGuard()

  const genealogyId = computed(() => Number(route.params.id))
  const userId = computed(() => Number(userStore.getUserInfo.userId) || 10001)

  const loading = ref(false)
  const saving = ref(false)
  const list = ref<Api.FamilyRule.Item[]>([])
  const dialogVisible = ref(false)
  const editId = ref<number | null>(null)
  const formRef = ref<FormInstance>()
  const form = reactive({
    title: '',
    category: 'jiaxun' as Api.FamilyRule.Category,
    content: '',
    origin: ''
  })

  const rules: FormRules = {
    title: [{ required: true, message: '请填写标题', trigger: 'blur' }],
    category: [{ required: true, message: '请选择分类', trigger: 'change' }],
    content: [{ required: true, message: '请填写内容', trigger: 'blur' }]
  }

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      await refreshSub()
      list.value = await fetchFamilyRuleList(genealogyId.value)
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const openCreate = () => {
    editId.value = null
    form.title = ''
    form.category = 'jiaxun'
    form.content = ''
    form.origin = ''
    dialogVisible.value = true
  }

  const openEdit = (row: Api.FamilyRule.Item) => {
    editId.value = row.id
    form.title = row.title
    form.category = row.category
    form.content = row.content
    form.origin = row.origin || ''
    dialogVisible.value = true
  }

  const save = async () => {
    const ok = await formRef.value?.validate().catch(() => false)
    if (!ok) return
    saving.value = true
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        content: form.content,
        origin: form.origin.trim()
      }
      if (editId.value) {
        await fetchUpdateFamilyRule(editId.value, payload, userId.value)
      } else {
        await fetchCreateFamilyRule(genealogyId.value, payload, userId.value)
      }
      ElMessage.success('已保存')
      dialogVisible.value = false
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  const onDelete = async (row: Api.FamilyRule.Item) => {
    try {
      await ElMessageBox.confirm(`确定删除「${row.title}」？`, '删除条目', { type: 'warning' })
      await fetchDeleteFamilyRule(row.id, userId.value)
      ElMessage.success('已删除')
      await load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }

  const move = async (row: Api.FamilyRule.Item, delta: number) => {
    const idx = list.value.findIndex((r) => r.id === row.id)
    const target = idx + delta
    if (idx < 0 || target < 0 || target >= list.value.length) return
    const next = [...list.value]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    list.value = next
    try {
      await fetchReorderFamilyRules(
        genealogyId.value,
        next.map((r) => r.id)
      )
    } catch (e: any) {
      ElMessage.error(e?.message || '排序失败')
      await load()
    }
  }

  watch(genealogyId, load, { immediate: true })
</script>
