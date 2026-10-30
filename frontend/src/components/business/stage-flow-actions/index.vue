<!-- 阶段推进 / 回退 · v3.1.6 五步；中部展示当前流程步骤（§0.6.2） -->
<template>
  <div class="stage-flow-actions sticky top-0 z-20 mb-4 -mx-1 px-4 py-3 art-card">
    <div class="flex items-center gap-3 flex-wrap">
      <div class="shrink-0 min-w-28">
        <ElButton v-if="prevLabel" :disabled="busy" @click="onPrev"> ← {{ prevLabel }} </ElButton>
        <span v-else class="text-sm text-g-400">已是首个阶段</span>
      </div>

      <div class="stage-steps flex-1 min-w-0">
        <ol class="stage-steps__list" aria-label="修谱流程步骤">
          <li
            v-for="(seg, index) in segments"
            :key="seg.key"
            class="stage-steps__item"
            :class="segmentStateClass(seg, index)"
          >
            <button
              type="button"
              class="stage-steps__btn"
              :disabled="!isReached(seg) || busy"
              :aria-current="isCurrent(index) ? 'step' : undefined"
              @click="onStepClick(seg)"
            >
              <span class="stage-steps__dot">
                <ArtSvgIcon v-if="isDone(index)" icon="ri:check-line" class="text-xs" />
                <span v-else>{{ index + 1 }}</span>
              </span>
              <span class="stage-steps__label">{{ seg.label }}</span>
            </button>
            <span
              v-if="index < segments.length - 1"
              class="stage-steps__line"
              :class="{ 'is-done': isDone(index) }"
              aria-hidden="true"
            />
          </li>
        </ol>
      </div>

      <div class="shrink-0 min-w-28 flex justify-end">
        <ElButton
          v-if="nextLabel"
          type="primary"
          :loading="busy"
          :disabled="!!advanceBlockHint"
          v-ripple
          @click="onNext"
        >
          {{ nextLabel }} →
        </ElButton>
        <span v-else class="text-sm text-g-400">已到归档阶段</span>
      </div>
    </div>

    <p v-if="advanceBlockHint" class="mt-2 text-xs text-warning">{{ advanceBlockHint }}</p>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { fetchIsProjectInitialized } from '@/api/genealogy'
  import { checkAdvanceToArchive, checkAdvanceToLayout } from '@/api/workflow'
  import {
    getNextStage,
    getPrevStage,
    getProgressSegments,
    stageToBarIndex,
    STAGE_LABELS,
    type ProgressSegment
  } from '@/utils/genealogy/stage'

  defineOptions({ name: 'StageFlowActions' })

  defineProps<{
    pageStage?: Api.Genealogy.Stage
  }>()

  const router = useRouter()
  const genealogyStore = useGenealogyStore()
  const busy = ref(false)
  const projectInitialized = ref(false)

  const mode = computed(() => genealogyStore.currentMode || 'standard')
  const stage = computed(() => genealogyStore.currentStage)
  const genealogyId = computed(() => genealogyStore.currentGenealogyId)
  const personCount = computed(() => genealogyStore.current?.personCount ?? 0)

  const segments = computed(() => getProgressSegments(mode.value))
  const barIndex = computed(() => stageToBarIndex(mode.value, stage.value))

  const nextStage = computed(() => getNextStage(mode.value, stage.value))
  const prevStage = computed(() => getPrevStage(mode.value, stage.value))

  const nextLabel = computed(() =>
    nextStage.value ? `推进至${STAGE_LABELS[nextStage.value]}` : ''
  )
  const prevLabel = computed(() =>
    prevStage.value ? `回退至${STAGE_LABELS[prevStage.value]}` : ''
  )

  const isReached = (seg: ProgressSegment) => stage.value >= seg.requiredStage
  const isCurrent = (index: number) => index + 1 === barIndex.value
  const isDone = (index: number) => index + 1 < barIndex.value

  const segmentStateClass = (seg: ProgressSegment, index: number) => {
    if (!isReached(seg)) return 'is-pending'
    if (isCurrent(index)) return 'is-current'
    return 'is-done'
  }

  const onStepClick = (seg: ProgressSegment) => {
    if (!isReached(seg) || !genealogyId.value) return
    router.push(`/g/${genealogyId.value}/${seg.routeKey}`)
  }

  const refreshProjectGate = async () => {
    if (!genealogyId.value) {
      projectInitialized.value = false
      return
    }
    try {
      projectInitialized.value = await fetchIsProjectInitialized(genealogyId.value)
    } catch {
      projectInitialized.value = false
    }
  }

  watch(genealogyId, refreshProjectGate, { immediate: true })

  const assertCanAdvance = (target: Api.Genealogy.Stage): string | null => {
    if (!genealogyId.value) return '未进入族谱'
    if (stage.value === 1 && target === 2 && !projectInitialized.value) {
      return '请先创建修谱项目'
    }
    if (stage.value === 2 && (target === 3 || target === 4) && personCount.value <= 0) {
      return '请先录入至少 1 位族人'
    }
    if (stage.value === 3 && target === 4) {
      return checkAdvanceToLayout(genealogyId.value, mode.value)
    }
    if (stage.value === 4 && target === 5) {
      return checkAdvanceToArchive(genealogyId.value)
    }
    return null
  }

  const advanceBlockHint = computed(() => {
    const target = nextStage.value
    if (!target) return ''
    return assertCanAdvance(target) || ''
  })

  const onNext = async () => {
    const target = nextStage.value
    if (!target) return
    const block = assertCanAdvance(target)
    if (block) {
      ElMessage.warning(block)
      return
    }
    busy.value = true
    try {
      await genealogyStore.setStage(target, true)
      ElMessage.success(`已推进至${STAGE_LABELS[target]}`)
    } catch (e: any) {
      ElMessage.error(e?.message || '推进失败')
    } finally {
      busy.value = false
    }
  }

  const onPrev = async () => {
    const target = prevStage.value
    if (!target) return
    busy.value = true
    try {
      await genealogyStore.setStage(target, true)
      ElMessage.success(`已回退至${STAGE_LABELS[target]}`)
    } catch (e: any) {
      ElMessage.error(e?.message || '回退失败')
    } finally {
      busy.value = false
    }
  }
</script>

<style scoped lang="scss">
  .stage-steps {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;

    &__list {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 640px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    &__item {
      display: flex;
      align-items: center;
      min-width: 0;
      flex: 1;

      &:last-child {
        flex: 0 1 auto;
      }
    }

    &__btn {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      line-height: 1.2;

      &:disabled {
        cursor: not-allowed;
      }
    }

    &__dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: 1px solid var(--el-border-color);
      background: var(--el-bg-color);
      font-size: 11px;
      font-weight: 600;
      color: var(--el-text-color-secondary);
      transition:
        background 0.2s,
        border-color 0.2s,
        color 0.2s;
    }

    &__label {
      max-width: 5.5rem;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }

    &__line {
      flex: 1;
      height: 2px;
      min-width: 8px;
      margin: 0 4px 16px;
      border-radius: 999px;
      background: var(--el-border-color-lighter);

      &.is-done {
        background: var(--el-color-primary-light-5);
      }
    }

    &__item.is-done {
      .stage-steps__dot {
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      .stage-steps__label {
        color: var(--el-text-color-regular);
      }
    }

    &__item.is-current {
      .stage-steps__dot {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary);
        color: #fff;
      }

      .stage-steps__label {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    &__item.is-pending {
      .stage-steps__btn:disabled {
        opacity: 0.72;
      }
    }
  }

  @media (max-width: 768px) {
    .stage-steps__label {
      max-width: 3.2rem;
      font-size: 10px;
    }

    .stage-steps__line {
      min-width: 4px;
      margin-bottom: 14px;
    }
  }
</style>
