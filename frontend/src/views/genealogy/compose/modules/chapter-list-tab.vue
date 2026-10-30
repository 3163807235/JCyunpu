<!-- 谱书章节 Tab · 分页对齐人员列表 -->
<template>
  <div class="compose-pane">
    <ArtTableHeader class="shrink-0" layout="refresh" :loading="loading" @refresh="load">
      <template #left>
        <ElSpace wrap>
          <span class="text-sm text-g-500">管理谱序、凡例、家训等章节；支持排序与富文本编辑</span>
          <ElButton type="primary" v-ripple @click="openCreate">新增章节</ElButton>
        </ElSpace>
      </template>
    </ArtTableHeader>
    <div class="compose-pane__table">
      <ArtTable
        :loading="loading"
        :data="pageRows"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="false"
        @pagination:size-change="onSizeChange"
        @pagination:current-change="onPageChange"
      />
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="editId ? '编辑章节' : '新增章节'"
      width="720px"
      align-center
      destroy-on-close
    >
      <ElForm label-position="top">
        <ElFormItem label="类型">
          <ElSelect v-model="form.chapterType" class="w-full">
            <ElOption
              v-for="(label, key) in typeLabels"
              :key="key"
              :label="label"
              :value="key"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标题">
          <ElInput v-model="form.title" maxlength="64" show-word-limit />
        </ElFormItem>
        <ElFormItem label="正文">
          <ArtWangEditor v-model="form.contentHtml" height="280px" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchChapterList,
    fetchCreateChapter,
    fetchDeleteChapter,
    fetchReorderChapters,
    fetchUpdateChapter
  } from '@/api/chapter'
  import { CHAPTER_TYPE_LABELS } from '@/mock/chapter'
  import type { ColumnOption } from '@/types'

  defineOptions({ name: 'ChapterListTab' })

  const props = defineProps<{ genealogyId: number }>()

  const loading = ref(false)
  const saving = ref(false)
  const list = ref<Api.Chapter.Item[]>([])
  const dialogVisible = ref(false)
  const editId = ref<number | null>(null)
  const typeLabels = CHAPTER_TYPE_LABELS
  const pagination = reactive({ current: 1, size: 10, total: 0 })

  const form = reactive<Api.Chapter.FormParams>({
    chapterType: 'preface',
    title: '',
    contentHtml: ''
  })

  const slicePage = <T,>(rows: T[], page: { current: number; size: number; total: number }) => {
    page.total = rows.length
    const maxPage = Math.max(1, Math.ceil(rows.length / page.size) || 1)
    if (page.current > maxPage) page.current = maxPage
    const start = (page.current - 1) * page.size
    return rows.slice(start, start + page.size)
  }

  const pageRows = computed(() => slicePage(list.value, pagination))

  const fullIndexOf = (row: Api.Chapter.Item) => list.value.findIndex((c) => c.id === row.id)

  const columns = computed<ColumnOption[]>(() => [
    {
      prop: 'sortOrder',
      label: '序',
      width: 60,
      formatter: (row: Api.Chapter.Item) => row.sortOrder
    },
    {
      prop: 'chapterType',
      label: '类型',
      width: 100,
      formatter: (row: Api.Chapter.Item) => typeLabels[row.chapterType] || row.chapterType
    },
    {
      prop: 'title',
      label: '标题',
      minWidth: 160,
      formatter: (row: Api.Chapter.Item) => row.title
    },
    {
      prop: 'updatedAt',
      label: '更新时间',
      width: 160,
      formatter: (row: Api.Chapter.Item) => row.updatedAt
    },
    {
      prop: 'operation',
      label: '操作',
      width: 220,
      fixed: 'right',
      formatter: (row: Api.Chapter.Item) => {
        const idx = fullIndexOf(row)
        return h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
          h(ElButton, { link: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑'),
          h(
            ElButton,
            { link: true, disabled: idx <= 0, onClick: () => move(row, -1) },
            () => '上移'
          ),
          h(
            ElButton,
            {
              link: true,
              disabled: idx < 0 || idx >= list.value.length - 1,
              onClick: () => move(row, 1)
            },
            () => '下移'
          ),
          h(ElButton, { link: true, type: 'danger', onClick: () => onDelete(row) }, () => '删除')
        ])
      }
    }
  ])

  const load = async () => {
    loading.value = true
    try {
      list.value = await fetchChapterList(props.genealogyId)
      pagination.total = list.value.length
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const onSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
  }
  const onPageChange = (page: number) => {
    pagination.current = page
  }

  const openCreate = () => {
    editId.value = null
    form.chapterType = 'preface'
    form.title = ''
    form.contentHtml = ''
    dialogVisible.value = true
  }

  const openEdit = (row: Api.Chapter.Item) => {
    editId.value = row.id
    form.chapterType = row.chapterType
    form.title = row.title
    form.contentHtml = row.contentHtml
    dialogVisible.value = true
  }

  const save = async () => {
    if (!form.title.trim()) {
      ElMessage.warning('请填写标题')
      return
    }
    saving.value = true
    try {
      if (editId.value) {
        await fetchUpdateChapter(editId.value, { ...form })
      } else {
        await fetchCreateChapter(props.genealogyId, { ...form })
      }
      ElMessage.success('已保存')
      dialogVisible.value = false
      load()
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  const move = async (row: Api.Chapter.Item, delta: number) => {
    const ids = list.value.map((c) => c.id)
    const idx = ids.indexOf(row.id)
    const target = idx + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]
    list.value = await fetchReorderChapters(props.genealogyId, ids)
    pagination.total = list.value.length
  }

  const onDelete = async (row: Api.Chapter.Item) => {
    try {
      await ElMessageBox.confirm(`删除章节「${row.title}」？`, '提示', { type: 'warning' })
      await fetchDeleteChapter(row.id)
      ElMessage.success('已删除')
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }

  watch(
    () => props.genealogyId,
    () => {
      pagination.current = 1
      load()
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .compose-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .compose-pane__table {
    flex: 1;
    min-height: 0;
    overflow: hidden;

    :deep(.art-table) {
      height: 100% !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .el-table {
        flex: 1;
        min-height: 0;
        margin-top: 0;
      }

      .pagination {
        flex-shrink: 0;
        margin-top: 8px;
      }
    }
  }
</style>
