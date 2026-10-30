<template>
  <StageShell title="家族相册" description="V1.5 开放" badge="V1.5" :tabs="[]">
    <ElEmpty description="家族相册将在 V1.5 上线" />
  </StageShell>
</template>

<script setup lang="ts">
  import StageShell from '../modules/stage-shell.vue'

  defineOptions({ name: 'GenealogyCultureAlbum' })
</script>
