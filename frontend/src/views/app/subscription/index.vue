<!--
  兼容深链 /subscription?tab=xxx：进入后打开弹窗并回到工作台
  主入口为顶栏弹窗（mittBus openSubscription）
-->
<template>
  <div class="app-page flex-cc min-h-40 text-sm text-g-500">正在打开会员订阅中心…</div>
</template>

<script setup lang="ts">
  import { mittBus } from '@/utils/sys'

  defineOptions({ name: 'AppSubscription' })

  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    const tab = route.query.tab as string | undefined
    mittBus.emit('openSubscription', tab)
    router.replace('/console')
  })
</script>
