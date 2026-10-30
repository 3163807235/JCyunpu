<!-- 人员列表搜索 · 对齐脚手架 UserSearch + ArtSearchBar · §3.4 筛选条件 -->
<template>
  <ArtSearchBar
    v-model="formData"
    :items="formItems"
    label-width="60px"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  export type PersonSearchParams = {
    keyword?: string
    generation?: number
    gender?: Api.Person.Gender
    isAlive?: 0 | 1
    /** 默认 lineage：仅本族主系 */
    lineageScope?: Api.Person.LineageScope
  }

  interface Props {
    modelValue: PersonSearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: PersonSearchParams): void
    (e: 'search', params: PersonSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formItems = computed(() => [
    {
      label: '范围',
      key: 'lineageScope',
      type: 'select' as const,
      props: {
        placeholder: '人员范围',
        clearable: false,
        // 范围切换即查；携带 val，避免与 v-model 写回不同步
        onChange: (val: Api.Person.LineageScope) => {
          emit('search', { ...formData.value, lineageScope: val })
        },
        options: [
          { label: '仅本族主系', value: 'lineage' },
          { label: '仅姻亲配偶', value: 'affinal' },
          { label: '全部人物', value: 'all' }
        ]
      }
    },
    {
      label: '关键词',
      key: 'keyword',
      type: 'input' as const,
      placeholder: '编号 / 姓名 / 字辈',
      clearable: true
    },
    {
      label: '世代',
      key: 'generation',
      type: 'number' as const,
      props: {
        min: 1,
        max: 99,
        controlsPosition: 'right',
        placeholder: '请输入世代'
      }
    },
    {
      label: '性别',
      key: 'gender',
      type: 'select' as const,
      props: {
        placeholder: '请选择性别',
        clearable: true,
        options: [
          { label: '男', value: 1 },
          { label: '女', value: 2 },
          { label: '未知', value: 0 }
        ]
      }
    },
    {
      label: '在世',
      key: 'isAlive',
      type: 'select' as const,
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '在世', value: 1 },
          { label: '已故', value: 0 }
        ]
      }
    }
  ])

  function handleReset() {
    emit('reset')
  }

  function handleSearch(params: PersonSearchParams) {
    emit('search', params)
  }
</script>
