<!-- 五步成谱 / 快捷成谱进度条 · v3.1.6 §0.6.2 -->
<template>
  <div class="progress-bar art-card p-5 mb-5">
    <div class="flex-cb flex-wrap gap-2 mb-4">
      <div class="flex items-baseline gap-2 flex-wrap">
        <h3 class="text-base font-medium">{{ title }}</h3>
        <span v-if="mode === 'simple'" class="text-xs text-g-400">
          已跳过会审，可升级为标准模式
        </span>
      </div>
      <ElTag size="small" type="info">当前：{{ currentLabel }}</ElTag>
    </div>

    <div class="flex items-stretch gap-1 max-sm:flex-col">
      <button
        v-for="(seg, index) in segments"
        :key="seg.key"
        type="button"
        class="flex-1 min-w-0 px-2 py-3 rounded-lg text-left transition-colors border"
        :class="segmentClass(seg, index)"
        :disabled="!isReached(seg)"
        @click="onClick(seg)"
      >
        <div class="text-xs opacity-70 mb-1">{{ index + 1 }}/{{ segments.length }}</div>
        <div class="text-sm font-medium truncate">{{ seg.label }}</div>
        <div v-if="isDone(seg, index)" class="mt-1 text-xs text-success">已完成</div>
        <div v-else-if="isCurrent(index)" class="mt-1 text-xs text-theme">进行中</div>
        <div v-else-if="!isReached(seg)" class="mt-1 text-xs text-g-400">未到达</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import {
    getProgressSegments,
    getProgressTitle,
    stageToBarIndex,
    STAGE_LABELS,
    type ProgressSegment
  } from '@/utils/genealogy/stage'

  defineOptions({ name: 'GenealogyProgressBar' })

  const props = defineProps<{
    genealogyId: number
    mode: Api.Genealogy.Mode
    currentStage: Api.Genealogy.Stage
  }>()

  const router = useRouter()

  const segments = computed(() => getProgressSegments(props.mode))
  const title = computed(() => getProgressTitle(props.mode))
  const currentLabel = computed(() => STAGE_LABELS[props.currentStage])
  const barIndex = computed(() => stageToBarIndex(props.mode, props.currentStage))

  const isReached = (seg: ProgressSegment) => props.currentStage >= seg.requiredStage

  const isCurrent = (index: number) => index + 1 === barIndex.value

  const isDone = (_seg: ProgressSegment, index: number) => index + 1 < barIndex.value

  const segmentClass = (seg: ProgressSegment, index: number) => {
    if (!isReached(seg)) {
      return 'border-g-200 bg-g-100/50 text-g-400 cursor-not-allowed'
    }
    if (isCurrent(index)) {
      return 'border-theme/40 bg-theme/10 text-g-900 cursor-pointer'
    }
    return 'border-g-200 bg-white text-g-800 cursor-pointer hover:border-theme/30'
  }

  const onClick = (seg: ProgressSegment) => {
    if (!isReached(seg)) return
    router.push(`/g/${props.genealogyId}/${seg.routeKey}`)
  }
</script>
