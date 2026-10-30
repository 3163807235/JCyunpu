<!-- 页面说明按需展示：短文悬停，长文点击 · Remix Icon -->
<template>
  <span class="page-tip-icon-wrap">
    <ElPopover
      :placement="placement"
      :width="popWidth"
      :trigger="mode === 'popover' ? 'click' : 'hover'"
      :show-after="mode === 'popover' ? 0 : 200"
      :show-arrow="true"
      :popper-class="mode === 'popover' ? 'page-tip-popper' : 'page-tip-popper is-tooltip'"
    >
      <template #reference>
        <button type="button" class="page-tip-icon" :aria-label="ariaLabel">
          <ArtSvgIcon :icon="icon" class="text-base" />
          <span v-if="label" class="page-tip-icon__label">{{ label }}</span>
        </button>
      </template>
      <div class="page-tip-body">
        <p v-if="title" class="page-tip-body__title">{{ title }}</p>
        <div v-if="slots.default">
          <slot />
        </div>
        <p v-else-if="content" class="page-tip-body__text">{{ content }}</p>
      </div>
    </ElPopover>
  </span>
</template>

<script setup lang="ts">
  import type { Placement } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  defineOptions({ name: 'PageTipIcon' })

  const props = withDefaults(
    defineProps<{
      /** tooltip=悬停短说明；popover=点击看较长说明 */
      mode?: 'tooltip' | 'popover'
      content?: string
      title?: string
      /** 图标旁可选文字，如「说明」 */
      label?: string
      icon?: string
      placement?: Placement
      width?: number | string
      ariaLabel?: string
    }>(),
    {
      mode: 'tooltip',
      icon: 'ri:information-line',
      placement: 'top',
      width: 360,
      ariaLabel: '查看说明'
    }
  )

  const slots = useSlots()

  const popWidth = computed(() => (props.mode === 'popover' ? props.width : 280))
</script>

<style scoped lang="scss">
  .page-tip-icon-wrap {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }

  .page-tip-icon {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    line-height: 1;
    vertical-align: middle;

    &:hover {
      color: var(--el-color-primary);
    }

    &__label {
      font-size: 13px;
      line-height: 1.2;
    }
  }

  .page-tip-body {
    line-height: 1.55;
    font-size: 13px;
    color: inherit;

    :deep(p) {
      margin: 0;

      & + p {
        margin-top: 4px;
      }
    }

    &__title {
      margin: 0 0 6px;
      font-weight: 600;
      font-size: 13px;
    }

    &__text {
      margin: 0;
      white-space: pre-line;
    }
  }
</style>

<style lang="scss">
  .page-tip-popper.is-tooltip.el-popper {
    background: var(--el-text-color-primary);
    color: var(--el-color-white);
    border: none;

    .el-popper__arrow::before {
      background: var(--el-text-color-primary);
      border-color: var(--el-text-color-primary);
    }
  }
</style>
