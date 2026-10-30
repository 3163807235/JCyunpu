<template>
  <div />
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'GenealogySettingsRedirect' })

  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    router.replace(`/g/${route.params.id}/settings/roles`)
  })
</script>
