<!-- 兼容旧入口：信息管理 → 字辈列表（引导先配置派语） -->
<template>
  <div />
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'GenealogyInfoRedirect' })

  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    const id = route.params.id
    router.replace(`/g/${id}/info/generation`)
  })
</script>
