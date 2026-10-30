<!-- 生/卒：阳历 ⇄ 农历双向选择 · 产品文档 §1.7 -->
<template>
  <div class="person-lunar-date-field w-full flex flex-col gap-2">
    <div class="flex gap-2 items-center w-full flex-wrap">
      <span class="text-xs text-g-500 shrink-0 w-8">阳历</span>
      <ElDatePicker
        v-model="solarIso"
        type="date"
        value-format="YYYY-MM-DD"
        class="!flex-1 !min-w-40"
        :placeholder="placeholder"
        clearable
        @change="onSolarChange"
      />
      <ElButton class="shrink-0" @click="setUnknown">不详</ElButton>
    </div>

    <div class="flex gap-2 items-center w-full flex-wrap">
      <span class="text-xs text-g-500 shrink-0 w-8">农历</span>
      <ElSelect
        v-model="lunarYear"
        class="!w-24"
        filterable
        placeholder="年"
        @change="onLunarChange"
      >
        <ElOption v-for="y in yearOptions" :key="y.value" :label="y.label" :value="y.value" />
      </ElSelect>
      <ElSelect v-model="lunarMonth" class="!w-28" placeholder="月" @change="onLunarMonthOrDay">
        <ElOption v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
      </ElSelect>
      <ElSelect v-model="lunarDay" class="!w-24" placeholder="日" @change="onLunarMonthOrDay">
        <ElOption v-for="d in dayOptions" :key="d.value" :label="d.label" :value="d.value" />
      </ElSelect>
    </div>

    <p v-if="modelValue" class="text-xs text-g-600 leading-relaxed break-all">
      <span class="text-g-500">存档：</span>{{ modelValue }}
    </p>
    <p v-else class="text-xs text-g-500">阳历与农历任选其一，另一侧自动换算</p>
  </div>
</template>

<script setup lang="ts">
  import {
    DATE_UNKNOWN_TEXT,
    buildDatePartsFromLunar,
    buildDatePartsFromSolar,
    composeStoredDate,
    getLunarDayCount,
    getLunarDayOptions,
    getLunarMonthOptions,
    getLunarYearOptions,
    parseIsoDate,
    parseStoredDate
  } from '@/utils/genealogy/person-date'

  defineOptions({ name: 'PersonLunarDateField' })

  const props = withDefaults(
    defineProps<{
      modelValue?: string
      placeholder?: string
      unknownText?: string
    }>(),
    {
      modelValue: '',
      placeholder: '选择阳历日期',
      unknownText: DATE_UNKNOWN_TEXT
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [string]
    change: [string]
  }>()

  const solarIso = ref('')
  const lunarYear = ref<number>()
  const lunarMonth = ref<number>()
  const lunarDay = ref<number>()
  let syncing = false

  const yearOptions = getLunarYearOptions()

  const monthOptions = computed(() =>
    lunarYear.value ? getLunarMonthOptions(lunarYear.value) : []
  )

  const dayOptions = computed(() => {
    if (!lunarYear.value || lunarMonth.value == null) return []
    return getLunarDayOptions(lunarYear.value, lunarMonth.value)
  })

  const applyPair = (pair: ReturnType<typeof buildDatePartsFromSolar>) => {
    syncing = true
    solarIso.value = pair.solarIso
    lunarYear.value = pair.lunar.year
    lunarMonth.value = pair.lunar.month
    lunarDay.value = pair.lunar.day
    nextTick(() => {
      syncing = false
    })
  }

  const clearParts = () => {
    syncing = true
    solarIso.value = ''
    lunarYear.value = undefined
    lunarMonth.value = undefined
    lunarDay.value = undefined
    nextTick(() => {
      syncing = false
    })
  }

  const emitStored = (text: string) => {
    emit('update:modelValue', text)
    emit('change', text)
  }

  const syncFromModel = () => {
    const parsed = parseStoredDate(props.modelValue)
    if (parsed.solar && parsed.lunar) {
      applyPair({
        solar: parsed.solar,
        lunar: parsed.lunar,
        solarIso: parsed.solarIso!,
        eraLunarText: parsed.eraLunarText || ''
      })
      return
    }
    // 不详或旧纯文本：不强行填选择器
    if (!props.modelValue || props.modelValue.includes('未详')) {
      clearParts()
    }
  }

  watch(
    () => props.modelValue,
    () => syncFromModel(),
    { immediate: true }
  )

  const onSolarChange = (iso: string | null) => {
    if (syncing) return
    if (!iso) {
      clearParts()
      emitStored('')
      return
    }
    const solar = parseIsoDate(iso)
    if (!solar) return
    try {
      const pair = buildDatePartsFromSolar(solar)
      applyPair(pair)
      emitStored(composeStoredDate(pair))
    } catch {
      emitStored('')
    }
  }

  const onLunarChange = () => {
    if (syncing) return
    if (lunarYear.value) {
      const months = getLunarMonthOptions(lunarYear.value)
      if (!months.some((m) => m.value === lunarMonth.value)) {
        lunarMonth.value = months[0]?.value
      }
      if (lunarMonth.value != null) {
        const maxDay = getLunarDayCount(lunarYear.value, lunarMonth.value)
        if (!lunarDay.value || lunarDay.value > maxDay) {
          lunarDay.value = 1
        }
      }
    }
    onLunarMonthOrDay()
  }

  const onLunarMonthOrDay = () => {
    if (syncing) return
    if (!lunarYear.value || lunarMonth.value == null) return

    const maxDay = getLunarDayCount(lunarYear.value, lunarMonth.value)
    if (!lunarDay.value || lunarDay.value > maxDay) {
      lunarDay.value = Math.min(lunarDay.value || 1, maxDay)
    }

    try {
      const pair = buildDatePartsFromLunar({
        year: lunarYear.value,
        month: lunarMonth.value,
        day: lunarDay.value
      })
      applyPair(pair)
      emitStored(composeStoredDate(pair))
    } catch {
      // 非法农历组合（极少）
    }
  }

  const setUnknown = () => {
    clearParts()
    emitStored(props.unknownText)
  }
</script>
