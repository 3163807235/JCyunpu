<!-- 世系规整 Tab：只读预览 + 缺失提示 · 分页对齐人员列表 -->
<template>
  <div class="compose-pane">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 shrink-0">
      <div v-for="s in stats" :key="s.label" class="art-card-sm p-3">
        <p class="text-xl font-medium">{{ s.value }}</p>
        <p class="text-xs text-g-500 mt-1">{{ s.label }}</p>
      </div>
    </div>

    <ArtTableHeader class="shrink-0" layout="refresh" :loading="loading" @refresh="load">
      <template #left>
        <span class="text-sm text-g-500">共 {{ rows.length }} 人</span>
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
  </div>
</template>

<script setup lang="ts">
  import { ElTag } from 'element-plus'
  import { fetchPersonList } from '@/api/person'
  import { fetchRelationList } from '@/api/relationship'
  import { REL_TYPE_LABELS } from '@/mock/relationship'
  import type { ColumnOption } from '@/types'

  defineOptions({ name: 'LineageReviewTab' })

  const props = defineProps<{ genealogyId: number }>()

  interface Row {
    name: string
    generation: number
    fatherLabel: string
    dateLabel: string
    missingFather: boolean
    missingDates: boolean
    issues: string[]
  }

  const loading = ref(false)
  const rows = ref<Row[]>([])
  const stats = ref<{ label: string; value: number | string }[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })

  const slicePage = <T,>(list: T[], page: { current: number; size: number; total: number }) => {
    page.total = list.length
    const maxPage = Math.max(1, Math.ceil(list.length / page.size) || 1)
    if (page.current > maxPage) page.current = maxPage
    const start = (page.current - 1) * page.size
    return list.slice(start, start + page.size)
  }

  const pageRows = computed(() => slicePage(rows.value, pagination))

  const columns = computed<ColumnOption[]>(() => [
    {
      prop: 'name',
      label: '人物',
      minWidth: 120,
      formatter: (row: Row) => row.name
    },
    {
      prop: 'generation',
      label: '世代',
      width: 80,
      formatter: (row: Row) => row.generation
    },
    {
      prop: 'fatherLabel',
      label: '父系',
      minWidth: 140,
      formatter: (row: Row) =>
        h('span', { class: row.missingFather ? 'text-danger' : '' }, row.fatherLabel)
    },
    {
      prop: 'dateLabel',
      label: '生卒',
      minWidth: 160,
      formatter: (row: Row) =>
        h('span', { class: row.missingDates ? 'text-danger' : '' }, row.dateLabel)
    },
    {
      prop: 'issues',
      label: '异常',
      minWidth: 160,
      formatter: (row: Row) => {
        if (!row.issues.length) return h('span', { class: 'text-g-400' }, '—')
        return h(
          'div',
          { class: 'flex flex-wrap gap-1' },
          row.issues.map((t) =>
            h(ElTag, { key: t, size: 'small', type: 'warning' }, () => t)
          )
        )
      }
    }
  ])

  const load = async () => {
    loading.value = true
    try {
      const [personRes, relations] = await Promise.all([
        fetchPersonList({
          genealogyId: props.genealogyId,
          current: 1,
          size: 500,
          scope: 'active',
          // 审阅缺父/缺日期：仅本族主系，姻亲不计入吊线节点要求
          lineageScope: 'lineage'
        }),
        fetchRelationList(props.genealogyId)
      ])
      const persons = personRes.records
      const nameMap = new Map(persons.map((p) => [p.id, p.nameWei]))

      let missingFather = 0
      let missingDates = 0

      rows.value = persons.map((p) => {
        const fatherRel = relations.find(
          (r) =>
            r.toPersonId === p.id &&
            ['father', 'sifu', 'jiantiao', 'jifu', 'yifu'].includes(r.relType)
        )
        const issues: string[] = []
        const noFather = p.generation > 1 && !fatherRel
        const noDates = !p.birthDate && !p.deathDate
        if (noFather) {
          missingFather++
          issues.push('无父系')
        }
        if (noDates) {
          missingDates++
          issues.push('无生卒')
        }
        if (p.zibeiDoubt) issues.push('字辈存疑')

        return {
          name: p.nameWei,
          generation: p.generation,
          fatherLabel: fatherRel
            ? `${nameMap.get(fatherRel.fromPersonId) || '#'}（${REL_TYPE_LABELS[fatherRel.relType]}）`
            : p.generation <= 1
              ? '始祖/首世'
              : '缺失',
          dateLabel: [p.birthDate, p.deathDate].filter(Boolean).join(' — ') || '缺失',
          missingFather: noFather,
          missingDates: noDates,
          issues
        }
      })

      stats.value = [
        { label: '人物总数', value: persons.length },
        { label: '关系条数', value: relations.length },
        { label: '缺父系', value: missingFather },
        { label: '缺生卒', value: missingDates }
      ]
      pagination.total = rows.value.length
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
