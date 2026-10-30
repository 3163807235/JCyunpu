<!-- 字辈列表 · 搜索 + 左对照表 + 右派语诗格（5列）· §3.4 页面 05 -->
<template>
  <div class="generation-list-page art-full-height flex flex-col">
    <GenerationSearch v-model="searchForm" @search="onSearch" @reset="onReset" />

    <div class="generation-split flex flex-col lg:flex-row gap-4 flex-1 min-h-0 mt-3">
      <!-- 左：各世字辈对照表 -->
      <ElCard
        class="art-table-card generation-split__main flex-1 min-w-0 !mb-0 !mt-0"
        shadow="never"
      >
        <ArtTableHeader layout="refresh" :loading="loading" @refresh="load">
          <template #left>
            <ElSpace wrap>
              <span class="text-sm text-g-600 inline-flex items-center gap-1">
                起始世代
                <PageTipIcon
                  content="建议先配置字辈诗再录入人员：新增人物时按世代自动匹配字辈，仍可手动改选（不匹配可存+存疑）。"
                />
              </span>
              <ElInputNumber v-model="startGen" :min="1" :max="99" size="small" />
              <ElButton type="primary" plain v-ripple @click="openAddDialog">
                <ArtSvgIcon icon="ri:add-line" class="mr-1" />
                添加字辈
              </ElButton>
              <ElButton type="primary" :loading="saving" v-ripple @click="save">保存</ElButton>
            </ElSpace>
          </template>
        </ArtTableHeader>
        <ArtTable :loading="loading" :data="filteredRows" :columns="columns" />
        <p v-if="!poemChars.length && !loading" class="text-sm text-g-500 text-center py-6">
          尚无派语，点击「添加字辈」开始录入
        </p>
      </ElCard>

      <!-- 右：字辈诗格 · 固定窄栏（覆盖 art-table-card 的 flex:1，避免对半开） -->
      <ElCard class="art-table-card generation-split__side !mb-0 !mt-0" shadow="never">
        <div class="art-card-header !pr-0 mb-3">
          <div class="title">
            <h4 class="!text-base flex items-center gap-2">
              <ArtSvgIcon icon="ri:grid-line" class="text-theme" />
              字辈诗格
            </h4>
            <p>每格一字 · 5 列对照</p>
          </div>
        </div>

        <ElEmpty v-if="!poemChars.length" description="暂无派语，请在左侧添加字辈">
          <ElButton type="primary" plain size="small" v-ripple @click="openAddDialog">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            添加字辈
          </ElButton>
        </ElEmpty>

        <div v-else class="grid grid-cols-5 gap-1.5">
          <button
            v-for="(ch, idx) in poemChars"
            :key="idx"
            type="button"
            class="art-card-sm relative flex flex-col items-center justify-center aspect-square p-0.5 tad-300 hover:bg-[var(--art-hover-color)]"
            :class="activeIndex === idx ? '!border-theme bg-theme/10 ring-1 ring-theme/25' : ''"
            @click="activeIndex = idx"
          >
            <ElInput
              v-model="poemChars[idx]"
              maxlength="1"
              size="small"
              class="poem-cell-input w-[70%]"
              @focus="activeIndex = idx"
              @input="onCellInput"
              @click.stop
            />
          </button>
        </div>
      </ElCard>
    </div>

    <ElDialog
      v-model="formVisible"
      :title="editIndex == null ? '添加字辈' : '编辑字辈'"
      width="420px"
      align-center
      destroy-on-close
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="formRules" label-position="top">
        <ElFormItem label="世代">
          <ElInput :model-value="`第${formGeneration}世`" disabled />
          <p v-if="editIndex == null" class="mt-1 text-xs text-g-500">
            按起始世代顺序追加（当前起始：第{{ startGen }}世）
          </p>
        </ElFormItem>
        <ElFormItem label="字辈" prop="zibei">
          <ElInput
            v-model="form.zibei"
            maxlength="1"
            placeholder="填一个字，如：伯"
            @keyup.enter="confirmForm"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="formVisible = false">取消</ElButton>
        <ElButton type="primary" v-ripple @click="confirmForm">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElTag, ElTooltip } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchGenerationConfig, fetchSaveGenerationConfig, fetchPersonList } from '@/api/person'
  import GenerationSearch, { type GenerationSearchParams } from './generation-search.vue'

  defineOptions({ name: 'GenerationTab' })

  const props = defineProps<{ genealogyId: number }>()

  interface GenRow {
    generation: number
    zibei: string
    personCount: number
    index: number
  }

  const loading = ref(false)
  const saving = ref(false)
  const startGen = ref(1)
  const poemChars = ref<string[]>([])
  const activeIndex = ref(0)
  const personCountByGen = ref<Record<number, number>>({})
  const searchForm = ref<GenerationSearchParams>({
    keyword: undefined,
    generation: undefined
  })
  const appliedSearch = ref<GenerationSearchParams>({})

  const formVisible = ref(false)
  /** null = 添加；number = 编辑下标 */
  const editIndex = ref<number | null>(null)
  const formRef = ref<FormInstance>()
  const form = reactive({ zibei: '' })
  const formRules: FormRules = {
    zibei: [
      { required: true, message: '请输入字辈字', trigger: 'blur' },
      {
        validator: (_r, val, cb) => {
          const s = String(val || '')
            .replace(/\s/g, '')
            .slice(0, 1)
          if (!s) cb(new Error('请输入一个字'))
          else cb()
        },
        trigger: 'blur'
      }
    ]
  }

  const nextGeneration = computed(() => startGen.value + poemChars.value.length)
  const formGeneration = computed(() =>
    editIndex.value == null ? nextGeneration.value : startGen.value + editIndex.value
  )

  const allRows = computed<GenRow[]>(() =>
    poemChars.value.map((zibei, index) => {
      const generation = startGen.value + index
      return {
        generation,
        zibei: zibei || '—',
        personCount: personCountByGen.value[generation] || 0,
        index
      }
    })
  )

  const filteredRows = computed(() => {
    const kw = (appliedSearch.value.keyword || '').trim()
    const gen = appliedSearch.value.generation
    return allRows.value.filter((row) => {
      if (gen != null && row.generation !== gen) return false
      if (kw && !row.zibei.includes(kw)) return false
      return true
    })
  })

  /** 操作列：Remix Icon + Tooltip（项目原始文档 · 图标） */
  const opIconBtn = (opts: {
    title: string
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

  const columns = computed(() => [
    {
      prop: 'generation',
      label: '世代',
      width: 100,
      formatter: (row: GenRow) => `第${row.generation}世`
    },
    {
      prop: 'zibei',
      label: '字辈',
      minWidth: 120,
      formatter: (row: GenRow) =>
        h('span', { class: 'font-medium' }, poemChars.value[row.index] || '—')
    },
    {
      prop: 'personCount',
      label: '在录人数',
      width: 110,
      formatter: (row: GenRow) =>
        row.personCount > 0
          ? h(ElTag, { size: 'small', type: 'info' }, () => String(row.personCount))
          : h('span', { class: 'text-g-400' }, '0')
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      formatter: (row: GenRow) =>
        h('div', { class: 'flex items-center flex-nowrap' }, [
          opIconBtn({
            title: '编辑',
            icon: 'ri:pencil-line',
            toneClass: 'bg-secondary/12 text-secondary',
            onClick: () => openEditDialog(row.index)
          }),
          opIconBtn({
            title: '删除',
            icon: 'ri:delete-bin-5-line',
            toneClass: 'bg-error/12 text-error',
            disabled: poemChars.value.length === 0,
            onClick: () => removeCell(row.index)
          })
        ])
    }
  ])

  const poemFromChars = () =>
    poemChars.value
      .map((c) => c.trim())
      .filter(Boolean)
      .join('')

  const onCellInput = () => {
    poemChars.value = poemChars.value.map((c) =>
      String(c || '')
        .replace(/\s/g, '')
        .slice(0, 1)
    )
  }

  const openAddDialog = () => {
    editIndex.value = null
    form.zibei = ''
    formVisible.value = true
  }

  const openEditDialog = (idx: number) => {
    editIndex.value = idx
    activeIndex.value = idx
    form.zibei = poemChars.value[idx] || ''
    formVisible.value = true
  }

  const resetForm = () => {
    form.zibei = ''
    editIndex.value = null
    formRef.value?.clearValidate()
  }

  const confirmForm = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    const ch = form.zibei.replace(/\s/g, '').slice(0, 1)
    if (!ch) {
      ElMessage.warning('请输入一个字')
      return
    }
    const dupIdx = poemChars.value.findIndex((c, i) => c === ch && i !== editIndex.value)
    if (dupIdx >= 0) {
      ElMessage.warning(`字辈「${ch}」已存在于第${startGen.value + dupIdx}世`)
      return
    }
    if (editIndex.value == null) {
      const gen = nextGeneration.value
      poemChars.value.push(ch)
      activeIndex.value = poemChars.value.length - 1
      formVisible.value = false
      ElMessage.success(`已添加第${gen}世「${ch}」，请记得保存`)
    } else {
      const idx = editIndex.value
      const gen = startGen.value + idx
      poemChars.value[idx] = ch
      activeIndex.value = idx
      formVisible.value = false
      ElMessage.success(`已更新第${gen}世为「${ch}」，请记得保存`)
    }
  }

  const removeCell = (idx: number) => {
    if (poemChars.value.length <= 1) {
      poemChars.value = []
      activeIndex.value = 0
      return
    }
    poemChars.value.splice(idx, 1)
    if (activeIndex.value >= poemChars.value.length) {
      activeIndex.value = Math.max(0, poemChars.value.length - 1)
    }
  }

  const loadPersonCounts = async () => {
    const res = await fetchPersonList({
      genealogyId: props.genealogyId,
      current: 1,
      size: 500,
      scope: 'active',
      lineageScope: 'all'
    })
    const map: Record<number, number> = {}
    res.records.forEach((p) => {
      map[p.generation] = (map[p.generation] || 0) + 1
    })
    personCountByGen.value = map
  }

  const load = async () => {
    loading.value = true
    try {
      const [cfg] = await Promise.all([
        fetchGenerationConfig(props.genealogyId),
        loadPersonCounts()
      ])
      startGen.value = cfg.startGen || 1
      const chars = (cfg.poem || '').replace(/\s/g, '').split('').filter(Boolean)
      poemChars.value = chars.length ? chars : []
      activeIndex.value = 0
    } catch (e: any) {
      ElMessage.error(e?.message || '加载字辈失败')
    } finally {
      loading.value = false
    }
  }

  const save = async () => {
    saving.value = true
    try {
      await fetchSaveGenerationConfig(props.genealogyId, {
        poem: poemFromChars(),
        startGen: startGen.value
      })
      ElMessage.success('字辈设置已保存')
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  const onSearch = (params: GenerationSearchParams) => {
    appliedSearch.value = { ...params }
  }

  const onReset = () => {
    searchForm.value = { keyword: undefined, generation: undefined }
    appliedSearch.value = {}
  }

  watch(() => props.genealogyId, load, { immediate: true })
</script>

<style scoped>
  /* 左右卡片统一取消 art-table-card 默认 margin-top，间距交给外层 gap */
  .generation-split :deep(.el-card.art-table-card) {
    margin-top: 0;
  }

  .generation-split__main :deep(.el-card__body),
  .generation-split__side :deep(.el-card__body) {
    padding: 16px;
  }

  /*
   * art-table-card 全局带 flex:1，会导致左右对半开。
   * 右侧诗格固定窄栏（约 5 列格子舒适宽度），左侧吃满剩余空间。
   */
  .generation-split__side {
    flex: 0 0 400px !important;
    width: 400px !important;
    max-width: 400px !important;
    min-width: 400px !important;
  }

  @media (max-width: 1023px) {
    .generation-split__side {
      flex: 1 1 auto !important;
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
    }
  }

  /* 诗格内输入框：对齐表格字辈列的紧凑单字录入 */
  .poem-cell-input :deep(.el-input__wrapper) {
    padding-left: 0;
    padding-right: 0;
    box-shadow: none;
    background: transparent;
  }

  .poem-cell-input :deep(.el-input__inner) {
    text-align: center;
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--art-gray-900);
  }
</style>
