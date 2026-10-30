<!-- 家族文化 · 家族大事记 · §3.4 页面 10 Tab2 -->
<template>
  <StageShell
    title="家族大事记"
    description="按时间线记录家族重大事件，归属族谱级文化数据"
    :tabs="[]"
  >
    <div v-loading="loading">
      <div class="flex-cb flex-wrap gap-3 mb-4">
        <ElSpace wrap>
          <ElRadioGroup v-model="viewMode" size="small">
            <ElRadioButton value="timeline">时间轴</ElRadioButton>
            <ElRadioButton value="list">列表</ElRadioButton>
          </ElRadioGroup>
          <ElSelect
            v-model="filterType"
            clearable
            placeholder="事件类型"
            class="!w-36"
            @change="load"
          >
            <ElOption
              v-for="(label, key) in EVENT_TYPE_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </ElSelect>
          <ElInput
            v-model="keyword"
            clearable
            placeholder="搜索标题/日期"
            class="!w-48"
            @keyup.enter="load"
            @clear="load"
          />
          <ElButton @click="load">查询</ElButton>
        </ElSpace>
        <ElButton type="primary" :disabled="!canEdit" v-ripple @click="openCreate">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新增事件
        </ElButton>
      </div>

      <!-- 时间轴 -->
      <div v-if="viewMode === 'timeline'" class="event-timeline">
        <ElEmpty v-if="!list.length" description="暂无大事记" />
        <div
          v-for="row in list"
          :key="row.id"
          class="event-timeline__item relative pl-8 pb-6 border-l border-[var(--el-border-color)] ml-3"
        >
          <span
            class="absolute left-0 top-1 -translate-x-1/2 size-3 rounded-full bg-theme ring-4 ring-[var(--default-box-color)]"
          />
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="text-sm font-medium text-g-800">{{ row.eventDate }}</span>
            <ElTag size="small" type="info">{{ EVENT_TYPE_LABELS[row.eventType] }}</ElTag>
          </div>
          <h4 class="text-base font-medium mb-1">{{ row.title }}</h4>
          <div
            v-if="row.description"
            class="text-sm text-g-600 prose-sm mb-2"
            v-html="row.description"
          />
          <div class="flex gap-2">
            <ElButton link type="primary" :disabled="!canEdit" @click="openEdit(row)"
              >编辑</ElButton
            >
            <ElButton link type="danger" :disabled="!canEdit" @click="onDelete(row)">删除</ElButton>
          </div>
        </div>
      </div>

      <!-- 列表 -->
      <ElTable v-else :data="list" stripe>
        <ElTableColumn prop="eventDate" label="日期" width="160" />
        <ElTableColumn label="类型" width="100">
          <template #default="{ row }">
            {{ EVENT_TYPE_LABELS[row.eventType] }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="title" label="标题" min-width="160" />
        <ElTableColumn prop="updatedAt" label="更新时间" width="170" />
        <ElTableColumn label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" :disabled="!canEdit" @click="openEdit(row)"
              >编辑</ElButton
            >
            <ElButton link type="danger" :disabled="!canEdit" @click="onDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="editId ? '编辑事件' : '新增事件'"
      width="720px"
      align-center
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="formRules" label-position="top">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="事件日期" prop="eventDate">
              <ElInput
                v-model="form.eventDate"
                maxlength="32"
                placeholder="如：民国二十五年丙子秋"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="事件类型" prop="eventType">
              <ElSelect v-model="form.eventType" class="w-full">
                <ElOption
                  v-for="(label, key) in EVENT_TYPE_LABELS"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="标题" prop="title">
          <ElInput v-model="form.title" maxlength="128" show-word-limit />
        </ElFormItem>
        <ElFormItem label="关联人物">
          <ElSelect
            v-model="form.relatedPersonIds"
            multiple
            filterable
            clearable
            class="w-full"
            placeholder="可选，关联本谱人物"
          >
            <ElOption
              v-for="p in persons"
              :key="p.id"
              :label="`${p.nameWei}（第${p.generation}世）`"
              :value="p.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="描述">
          <ArtWangEditor v-model="form.description" height="240px" />
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
    EVENT_TYPE_LABELS,
    fetchCreateFamilyEvent,
    fetchDeleteFamilyEvent,
    fetchFamilyEventList,
    fetchUpdateFamilyEvent
  } from '@/api/culture'
  import { fetchPersonList } from '@/api/person'
  import { useUserStore } from '@/store/modules/user'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'
  import StageShell from '../modules/stage-shell.vue'

  defineOptions({ name: 'GenealogyCultureEvents' })

  const route = useRoute()
  const userStore = useUserStore()
  const { canEdit, refresh: refreshSub } = useSubscriptionGuard()

  const genealogyId = computed(() => Number(route.params.id))
  const userId = computed(() => Number(userStore.getUserInfo.userId) || 10001)

  const loading = ref(false)
  const saving = ref(false)
  const viewMode = ref<'timeline' | 'list'>('timeline')
  const filterType = ref<Api.FamilyEvent.EventType | ''>('')
  const keyword = ref('')
  const list = ref<Api.FamilyEvent.Item[]>([])
  const persons = ref<Api.Person.Item[]>([])
  const dialogVisible = ref(false)
  const editId = ref<number | null>(null)
  const formRef = ref<FormInstance>()
  const form = reactive({
    eventDate: '',
    eventType: 'other' as Api.FamilyEvent.EventType,
    title: '',
    description: '',
    relatedPersonIds: [] as number[]
  })

  const formRules: FormRules = {
    eventDate: [{ required: true, message: '请填写事件日期', trigger: 'blur' }],
    eventType: [{ required: true, message: '请选择类型', trigger: 'change' }],
    title: [{ required: true, message: '请填写标题', trigger: 'blur' }]
  }

  const loadPersons = async () => {
    try {
      const res = await fetchPersonList({
        genealogyId: genealogyId.value,
        current: 1,
        size: 500,
        scope: 'active',
        lineageScope: 'all'
      })
      persons.value = res.records
    } catch {
      persons.value = []
    }
  }

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      await refreshSub()
      list.value = await fetchFamilyEventList({
        genealogyId: genealogyId.value,
        eventType: filterType.value || undefined,
        keyword: keyword.value || undefined
      })
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const openCreate = () => {
    editId.value = null
    form.eventDate = ''
    form.eventType = 'other'
    form.title = ''
    form.description = ''
    form.relatedPersonIds = []
    dialogVisible.value = true
  }

  const openEdit = (row: Api.FamilyEvent.Item) => {
    editId.value = row.id
    form.eventDate = row.eventDate
    form.eventType = row.eventType
    form.title = row.title
    form.description = row.description || ''
    form.relatedPersonIds = [...(row.relatedPersonIds || [])]
    dialogVisible.value = true
  }

  const save = async () => {
    const ok = await formRef.value?.validate().catch(() => false)
    if (!ok) return
    saving.value = true
    try {
      const payload = {
        eventDate: form.eventDate.trim(),
        eventType: form.eventType,
        title: form.title.trim(),
        description: form.description,
        relatedPersonIds: form.relatedPersonIds
      }
      if (editId.value) {
        await fetchUpdateFamilyEvent(editId.value, payload, userId.value)
      } else {
        await fetchCreateFamilyEvent(genealogyId.value, payload, userId.value)
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

  const onDelete = async (row: Api.FamilyEvent.Item) => {
    try {
      await ElMessageBox.confirm(`确定删除「${row.title}」？`, '删除事件', { type: 'warning' })
      await fetchDeleteFamilyEvent(row.id, userId.value)
      ElMessage.success('已删除')
      await load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }

  watch(
    genealogyId,
    async () => {
      await loadPersons()
      await load()
    },
    { immediate: true }
  )
</script>
