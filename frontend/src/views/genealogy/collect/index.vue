<!-- 兼容旧路径 /collect → 重定向至信息管理（Sprint M） -->
<template>
  <div class="p-8 text-center text-g-500 text-sm">正在前往信息管理…</div>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'GenealogyCollectRedirect' })

  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    const id = route.params.id
    router.replace(`/g/${id}/info/persons`)
  })
</script>
