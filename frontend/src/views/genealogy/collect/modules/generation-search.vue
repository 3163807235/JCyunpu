<!-- 字辈列表搜索 · ArtSearchBar -->
<template>
  <ArtSearchBar v-model="formData" :items="formItems" @reset="handleReset" @search="handleSearch" />
</template>

<script setup lang="ts">
  export type GenerationSearchParams = {
    keyword?: string
    generation?: number
  }

  interface Props {
    modelValue: GenerationSearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: GenerationSearchParams): void
    (e: 'search', params: GenerationSearchParams): void
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
      label: '关键词',
      key: 'keyword',
      type: 'input' as const,
      placeholder: '字辈字',
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
        placeholder: '世代号'
      }
    }
  ])

  const handleSearch = () => emit('search', { ...formData.value })
  const handleReset = () => emit('reset')
</script>
