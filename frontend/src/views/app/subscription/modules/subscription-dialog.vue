<!-- 会员订阅中心弹窗 · 产品文档 v3.1.6 §3.4 页面 13；视口约束见原始文档「弹窗视口」 -->
<template>
  <ElDialog
    :model-value="visible"
    title="会员订阅中心"
    width="920px"
    align-center
    destroy-on-close
    append-to-body
    @close="emit('update:visible', false)"
  >
    <SubscriptionPanel v-if="visible" :initial-tab="initialTab" />
  </ElDialog>
</template>

<script setup lang="ts">
  import SubscriptionPanel from './subscription-panel.vue'

  defineOptions({ name: 'SubscriptionDialog' })

  defineProps<{
    visible: boolean
    initialTab?: string
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
  }>()
</script>
