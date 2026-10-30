<!-- 权限管理 · 分支负责 · V1.5 -->
<template>
  <StageShell
    title="分支负责"
    description="按世系划分分支并指定负责人；V1.5 与校对邀请联动"
    badge="V1.5"
    :tabs="[]"
  >
    <ElEmpty description="分支负责将在 V1.5 上线（迁移说明：MVP 隐藏完整能力）" />
  </StageShell>
</template>

<script setup lang="ts">
  import StageShell from '../modules/stage-shell.vue'

  defineOptions({ name: 'GenealogySettingsBranches' })
</script>
