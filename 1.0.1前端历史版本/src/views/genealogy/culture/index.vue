<template>
  <div />
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'GenealogyCultureRedirect' })

  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    router.replace(`/g/${route.params.id}/culture/rules`)
  })
</script>
