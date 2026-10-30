<!-- 人员列表 · 沿用脚手架用户管理 ArtTable/useTable，列名对齐族谱字段 · v3.1.6 §3.4 -->
<template>
  <div class="person-list-page art-full-height">
    <ElAlert
      v-if="subscriptionExpired"
      class="mb-3! shrink-0"
      type="error"
      :closable="false"
      title="订阅已过期：仅可浏览，不可新增、编辑、导入或删除。请续费后恢复。"
    />
    <ElAlert
      v-else-if="quotaExhausted"
      class="mb-3! shrink-0"
      type="warning"
      :closable="false"
      title="人物额度已用尽：已禁用新增与导入，仍可编辑已有人物。请扩容或清理回收站。"
    />

    <PersonSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <p class="text-xs text-g-500 mb-3 shrink-0">
      额度
      {{ personUsed }}
      /
      {{
        personLimit
      }}（含回收站占用）。默认仅显示本族主系；姻亲配偶请用筛选「仅姻亲配偶」或「全部人物」。
    </p>

    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshAll">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="trashVisible = true">回收站</ElButton>
            <ElButton :disabled="!canWrite || quotaExhausted" @click="importVisible = true">
              批量导入
            </ElButton>
            <ElButton
              v-if="showCreateFirst"
              type="primary"
              :disabled="!canWrite || quotaExhausted"
              v-ripple
              @click="openCreate"
            >
              新增人物
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <PersonFormDialog
      v-model:visible="formVisible"
      :genealogy-id="genealogyId"
      :edit-item="editItem"
      :relate-from="relateFrom"
      @success="onPersonChanged"
    />
    <PersonTrashDrawer
      v-model:visible="trashVisible"
      :genealogy-id="genealogyId"
      @changed="onPersonChanged"
    />
    <PersonDetailDialog
      v-model:visible="detailVisible"
      :person="actionPerson"
      :persons="allPersons"
      :relations="relations"
    />
    <PersonFatherDialog
      v-model:visible="fatherVisible"
      :genealogy-id="genealogyId"
      :person="actionPerson"
      :persons="allPersons"
      :father-relations="actionFatherRels"
      @success="loadRelations"
    />
    <PersonBatchChildrenDialog
      v-model:visible="batchChildrenVisible"
      :genealogy-id="genealogyId"
      :parent="actionPerson"
      @success="onPersonChanged"
    />
    <PersonImportDialog
      v-model:visible="importVisible"
      :genealogy-id="genealogyId"
      :person-limit="personLimit"
      @success="onPersonChanged"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, ElTag, ElTooltip } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtButtonMore, {
    type ButtonMoreItem
  } from '@/components/core/forms/art-button-more/index.vue'
  import { fetchPersonList, fetchSoftDeletePerson } from '@/api/person'
  import { fetchSubscriptionSummary } from '@/api/genealogy'
  import { fetchRelationList } from '@/api/relationship'
  import PersonFormDialog from './person-form-dialog.vue'
  import PersonTrashDrawer from './person-trash-drawer.vue'
  import PersonDetailDialog from './person-detail-dialog.vue'
  import PersonFatherDialog from './person-father-dialog.vue'
  import PersonBatchChildrenDialog from './person-batch-children-dialog.vue'
  import PersonImportDialog from './person-import-dialog.vue'
  import PersonSearch, { type PersonSearchParams } from './person-search.vue'
  import { displayXingdi } from '@/utils/genealogy/xingdi'
  import { isAffinalPerson } from '@/utils/genealogy/person-lineage'

  defineOptions({ name: 'PersonListTab' })

  const props = defineProps<{ genealogyId: number }>()

  const allPersons = ref<Api.Person.Item[]>([])
  const relations = ref<Api.Relationship.Item[]>([])
  const formVisible = ref(false)
  const trashVisible = ref(false)
  const detailVisible = ref(false)
  const fatherVisible = ref(false)
  const batchChildrenVisible = ref(false)
  const importVisible = ref(false)
  const editItem = ref<Api.Person.Item | null>(null)
  const relateFrom = ref<Api.Person.Item | null>(null)
  const actionPerson = ref<Api.Person.Item | null>(null)
  /** 已拉取过全量名单，避免加载前误显「新增人物」 */
  const personsBootstrapped = ref(false)

  const personUsed = ref(0)
  const personLimit = ref(50)
  const subscriptionStatus = ref<Api.Subscription.Status>('trial')

  const searchForm = ref<PersonSearchParams>({
    keyword: undefined,
    generation: undefined,
    gender: undefined,
    isAlive: undefined,
    lineageScope: 'lineage'
  })

  const quotaExhausted = computed(() => personUsed.value >= personLimit.value)
  const subscriptionExpired = computed(() => subscriptionStatus.value === 'expired')
  const canWrite = computed(() => !subscriptionExpired.value)
  const canEdit = computed(() => !subscriptionExpired.value)

  const personNameMap = computed(() => {
    const map = new Map<number, string>()
    allPersons.value.forEach((p) => map.set(p.id, p.nameWei))
    return map
  })

  const fatherNameOf = (personId: number) => {
    const mine = relations.value.filter((r) => r.fromPersonId === personId)
    const bio = mine.find((r) => r.relType === 'father')
    if (bio) return personNameMap.value.get(bio.toPersonId) || '—'
    const other = mine.find((r) => ['sifu', 'jiantiao', 'jifu', 'yifu'].includes(r.relType))
    if (!other) return '—'
    const label =
      other.relType === 'sifu'
        ? '嗣'
        : other.relType === 'jiantiao'
          ? '兼祧'
          : other.relType === 'jifu'
            ? '继'
            : '义'
    return `${personNameMap.value.get(other.toPersonId) || '—'}（${label}）`
  }

  const chuChengOf = (personId: number) => {
    const mine = relations.value.filter((r) => r.fromPersonId === personId)
    const parts: string[] = []
    for (const r of mine) {
      const target = personNameMap.value.get(r.toPersonId) || `#${r.toPersonId}`
      if (r.relType === 'chuji') parts.push(`出继${target}`)
      else if (r.relType === 'sifu') parts.push(`承嗣${target}`)
      else if (r.relType === 'jiantiao') parts.push(`兼祧${target}`)
    }
    return parts.length ? parts.join('；') : '—'
  }

  const actionFatherRels = computed(() => {
    if (!actionPerson.value) return []
    return relations.value.filter(
      (r) => r.fromPersonId === actionPerson.value!.id && r.relType === 'father'
    )
  })

  const genderText = (g: Api.Person.Gender) => (g === 1 ? '男' : g === 2 ? '女' : '未知')
  const isAffinalRow = (row: Api.Person.Item) => isAffinalPerson(row, relations.value)

  /**
   * 操作列：文档约定 Remix Icon，经 ArtSvgIcon 使用（形如 ri:xxx）
   * 依据：项目原始文档 · 图标
   */
  const opIconBtn = (opts: {
    title: string
    /** Remix Icon，如 ri:pencil-line */
    icon: `ri:${string}`
    toneClass: string
    disabled?: boolean
    onClick: () => void
  }) =>
    h(
      ElTooltip,
      { content: opts.title, placement: 'top' },
      {
        default: () =>
          h(
            'button',
            {
              type: 'button',
              class: [
                'inline-flex items-center justify-center size-8 mr-2 rounded-md align-middle',
                opts.disabled
                  ? 'bg-g-200/50 text-g-400 cursor-not-allowed opacity-60'
                  : `c-p ${opts.toneClass}`
              ],
              disabled: opts.disabled,
              onClick: (e: Event) => {
                e.stopPropagation()
                if (opts.disabled) return
                opts.onClick()
              }
            },
            [h(ArtSvgIcon, { icon: opts.icon, class: 'text-base' })]
          )
      }
    )

  /** 三点更多：批量添加子女、删除（沿用 ArtButtonMore，与角色管理操作列一致） */
  const opMoreMenu = (row: Api.Person.Item) =>
    h(ArtButtonMore, {
      list: [
        {
          key: 'batch',
          label: '批量添加子女',
          icon: 'ri:group-line',
          disabled: !canWrite.value || quotaExhausted.value
        },
        {
          key: 'delete',
          label: '删除',
          icon: 'ri:delete-bin-5-line',
          color: 'var(--el-color-danger)',
          disabled: !canWrite.value
        }
      ],
      onClick: (item: ButtonMoreItem) => {
        if (item.key === 'batch') openBatchAddChildren(row)
        else if (item.key === 'delete') onDelete(row)
      }
    })

  const fetchList = (params: Record<string, any>) =>
    fetchPersonList({
      genealogyId: props.genealogyId,
      current: params.current,
      size: params.size,
      keyword: params.keyword,
      generation: params.generation,
      gender: params.gender,
      isAlive: params.isAlive,
      lineageScope: (params.lineageScope as Api.Person.LineageScope) || 'lineage',
      scope: 'active'
    })

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchList,
      apiParams: {
        current: 1,
        size: 10,
        genealogyId: props.genealogyId,
        scope: 'active',
        lineageScope: 'lineage'
      },
      immediate: false,
      columnsFactory: () => [
        {
          prop: 'personNo',
          label: '编号',
          width: 110,
          showOverflowTooltip: true
        },
        {
          prop: 'nameWei',
          label: '成员（姓名）',
          minWidth: 160,
          formatter: (row) => {
            const affinal = isAffinalRow(row)
            const tip = [
              row.nameWei,
              row.nameZi ? `字${row.nameZi}` : '',
              affinal ? '姻亲' : '本族'
            ]
              .filter(Boolean)
              .join(' · ')
            const zi = row.nameZi
              ? h('span', { class: 'text-g-500 text-xs ml-1 shrink-0' }, `字${row.nameZi}`)
              : null
            const tag = h(
              ElTag,
              {
                size: 'small',
                type: affinal ? 'warning' : 'success',
                effect: 'plain',
                class: 'ml-1 shrink-0 align-middle'
              },
              () => (affinal ? '姻亲' : '本族')
            )
            // 单行省略 + 悬停气泡；勿 flex-wrap，否则行高被撑开
            return h(
              ElTooltip,
              { content: tip, placement: 'top', showAfter: 300 },
              {
                default: () =>
                  h('span', { class: 'inline-flex items-center max-w-full' }, [
                    h('span', { class: 'font-medium truncate' }, row.nameWei),
                    zi,
                    tag
                  ])
              }
            )
          }
        },
        {
          prop: 'gender',
          label: '性别',
          width: 70,
          formatter: (row) => genderText(row.gender)
        },
        {
          prop: 'generation',
          label: '世代',
          width: 80,
          formatter: (row) => `第${row.generation}世`
        },
        {
          prop: 'zibei',
          label: '字辈',
          width: 90,
          formatter: (row) => {
            const text = row.zibei || '—'
            const tip = row.zibeiDoubt ? `${text}（存疑）` : text
            return h(
              ElTooltip,
              { content: tip, placement: 'top', showAfter: 300, disabled: text === '—' },
              {
                default: () =>
                  h('span', { class: 'inline-flex items-center max-w-full' }, [
                    h('span', { class: 'truncate' }, text),
                    row.zibeiDoubt
                      ? h(
                          ElTag,
                          { size: 'small', type: 'warning', class: 'ml-1 shrink-0' },
                          () => '存疑'
                        )
                      : null
                  ])
              }
            )
          }
        },
        {
          prop: 'xingdi',
          label: '排行',
          width: 90,
          showOverflowTooltip: true,
          formatter: (row) => displayXingdi(row, relations.value, allPersons.value)
        },
        {
          prop: 'father',
          label: '父亲',
          minWidth: 100,
          showOverflowTooltip: true,
          formatter: (row) => fatherNameOf(row.id)
        },
        {
          prop: 'birthDate',
          label: '生',
          minWidth: 120,
          showOverflowTooltip: true,
          formatter: (row) => row.birthDate || '—'
        },
        {
          prop: 'deathDate',
          label: '卒',
          minWidth: 110,
          showOverflowTooltip: true,
          formatter: (row) => (row.isAlive === 1 ? '—' : row.deathDate || '—')
        },
        {
          prop: 'chuCheng',
          label: '出承',
          minWidth: 110,
          showOverflowTooltip: true,
          formatter: (row) => chuChengOf(row.id)
        },
        {
          prop: 'isAlive',
          label: '在世',
          width: 80,
          formatter: (row) => {
            if (row.isYoushang) {
              return h(ElTag, { size: 'small', type: 'warning', effect: 'plain' }, () => '幼殇')
            }
            return row.isAlive === 1 ? '在世' : '已故'
          }
        },
        {
          prop: 'operation',
          label: '操作',
          width: 240,
          fixed: 'right',
          formatter: (row) => {
            const affinal = isAffinalRow(row)
            return h('div', { class: 'flex items-center flex-nowrap' }, [
              opIconBtn({
                title: affinal ? '姻亲请在主系人物下添加子女' : '添加子女',
                icon: 'ri:user-add-line',
                toneClass: 'bg-theme/12 text-theme',
                disabled: affinal || !canWrite.value || quotaExhausted.value,
                onClick: () => openAddChild(row)
              }),
              opIconBtn({
                title: '查看详情',
                icon: 'ri:eye-line',
                toneClass: 'bg-info/12 text-info',
                onClick: () => openDetail(row)
              }),
              opIconBtn({
                title: '编辑',
                icon: 'ri:pencil-line',
                toneClass: 'bg-secondary/12 text-secondary',
                disabled: !canEdit.value,
                onClick: () => openEdit(row)
              }),
              opIconBtn({
                title: affinal ? '姻亲父系由主系维护' : '更改父节点',
                icon: 'ri:git-branch-line',
                toneClass: 'bg-theme/12 text-theme',
                disabled: affinal || !canWrite.value,
                onClick: () => openChangeFather(row)
              }),
              affinal ? null : opMoreMenu(row)
            ])
          }
        }
      ]
    }
  })

  /** 仅家族尚无任何人时显示「新增人物」；其后一律走行内「添加子女」 */
  const showCreateFirst = computed(() => personsBootstrapped.value && allPersons.value.length === 0)

  const loadQuota = async () => {
    const summary = await fetchSubscriptionSummary()
    personUsed.value = summary.personUsed
    personLimit.value = summary.personLimit
    subscriptionStatus.value = summary.status
  }

  const loadRelations = async () => {
    const [rels, personRes] = await Promise.all([
      fetchRelationList(props.genealogyId),
      // 全量人物（含姻亲），供父亲列/表单候选；列表表格另走 lineageScope 筛选
      fetchPersonList({
        genealogyId: props.genealogyId,
        current: 1,
        size: 500,
        scope: 'active',
        lineageScope: 'all'
      })
    ])
    relations.value = rels
    allPersons.value = personRes.records
    personsBootstrapped.value = true
  }

  const refreshAll = async () => {
    await Promise.all([refreshData(), loadRelations(), loadQuota()])
  }

  const handleSearch = (params: PersonSearchParams) => {
    const lineageScope = params.lineageScope || searchForm.value.lineageScope || 'lineage'
    // 与表单同步，避免仅改下拉未点搜索时 searchForm / searchParams 不一致
    searchForm.value = {
      ...searchForm.value,
      ...params,
      lineageScope
    }
    Object.assign(searchParams, {
      keyword: params.keyword,
      generation: params.generation,
      gender: params.gender,
      isAlive: params.isAlive,
      lineageScope,
      genealogyId: props.genealogyId,
      scope: 'active'
    })
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      keyword: undefined,
      generation: undefined,
      gender: undefined,
      isAlive: undefined,
      lineageScope: 'lineage'
    }
    resetSearchParams()
    Object.assign(searchParams, {
      genealogyId: props.genealogyId,
      scope: 'active',
      lineageScope: 'lineage'
    })
    getData()
  }

  const onPersonChanged = async () => {
    await loadQuota()
    await Promise.all([refreshData(), loadRelations()])
  }

  const openCreate = () => {
    editItem.value = null
    relateFrom.value = null
    formVisible.value = true
  }

  const openEdit = (row: Api.Person.Item) => {
    editItem.value = row
    relateFrom.value = null
    formVisible.value = true
  }

  const openDetail = (row: Api.Person.Item) => {
    actionPerson.value = row
    detailVisible.value = true
  }

  /** 行内添加子女：与「新增人物」同一表单，固定为当前人的子女 */
  const openAddChild = (row: Api.Person.Item) => {
    editItem.value = null
    relateFrom.value = row
    formVisible.value = true
  }

  /** 批量添加子女 */
  const openBatchAddChildren = (row: Api.Person.Item) => {
    actionPerson.value = row
    batchChildrenVisible.value = true
  }

  const openChangeFather = (row: Api.Person.Item) => {
    actionPerson.value = row
    fatherVisible.value = true
  }

  const onDelete = async (row: Api.Person.Item) => {
    try {
      await ElMessageBox.confirm(`将「${row.nameWei}」移入回收站？额度暂不释放。`, '删除人物', {
        type: 'warning'
      })
      await fetchSoftDeletePerson(row.id)
      ElMessage.success('已移入回收站')
      await onPersonChanged()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }

  watch(
    () => props.genealogyId,
    async (id) => {
      if (!id) return
      personsBootstrapped.value = false
      Object.assign(searchParams, {
        genealogyId: id,
        scope: 'active',
        lineageScope: searchForm.value.lineageScope || 'lineage'
      })
      await loadQuota()
      await Promise.all([getData(), loadRelations()])
    },
    { immediate: true }
  )
</script>
