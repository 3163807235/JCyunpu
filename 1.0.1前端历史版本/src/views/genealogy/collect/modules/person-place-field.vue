<!-- 地点：省市区级联 + 手动详址 · 产品文档 §1.7 籍贯/墓葬 -->
<template>
  <div class="person-place-field w-full flex flex-col gap-2">
    <ElCascader
      v-model="regionPath"
      class="w-full"
      :options="regionOptions"
      :props="cascaderProps"
      clearable
      filterable
      placeholder="选择省 / 市 / 区"
      @change="syncOut"
    />
    <ElInput
      v-model="detail"
      maxlength="80"
      show-word-limit
      :placeholder="detailPlaceholder"
      @input="syncOut"
    />
    <p v-if="modelValue" class="text-xs text-g-500 break-all">合并：{{ modelValue }}</p>
  </div>
</template>

<script setup lang="ts">
  import {
    REGION_OPTIONS,
    composePlaceText,
    parsePlaceText
  } from '@/utils/genealogy/person-place'

  defineOptions({ name: 'PersonPlaceField' })

  const props = withDefaults(
    defineProps<{
      modelValue?: string
      detailPlaceholder?: string
    }>(),
    {
      modelValue: '',
      detailPlaceholder: '村组、门牌、祠堂名等（手填）'
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [string]
  }>()

  const regionOptions = REGION_OPTIONS
  const cascaderProps = { expandTrigger: 'hover' as const }
  const regionPath = ref<string[]>([])
  const detail = ref('')
  let syncing = false

  const applyFromModel = () => {
    syncing = true
    const parsed = parsePlaceText(props.modelValue)
    regionPath.value = parsed.regionPath
    detail.value = parsed.detail
    nextTick(() => {
      syncing = false
    })
  }

  watch(
    () => props.modelValue,
    () => applyFromModel(),
    { immediate: true }
  )

  const syncOut = () => {
    if (syncing) return
    emit('update:modelValue', composePlaceText(regionPath.value || [], detail.value))
  }
</script>
