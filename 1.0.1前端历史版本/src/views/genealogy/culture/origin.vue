<template>
  <StageShell
    title="姓氏源流"
    description="V1.5 开放"
    badge="V1.5"
    :tabs="[]"
  >
    <ElEmpty description="姓氏源流将在 V1.5 上线" />
  </StageShell>
</template>

<script setup lang="ts">
  import StageShell from '../modules/stage-shell.vue'

  defineOptions({ name: 'GenealogyCultureOrigin' })
</script>
