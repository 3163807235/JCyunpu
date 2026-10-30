<!-- 官网公共壳：导航 + 页脚 + 落地样式 -->
<template>
  <div id="top" ref="rootRef" class="landing-page">
    <LandingNav />
    <main>
      <slot />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
  import '../styles/landing.css'
  import LandingNav from './LandingNav.vue'
  import LandingFooter from './LandingFooter.vue'
  import { useFadeIn } from '../composables/useFadeIn'

  defineOptions({ name: 'LandingShell' })

  const props = defineProps<{ pageTitle?: string }>()

  const rootRef = ref<HTMLElement | null>(null)
  useFadeIn(rootRef)

  onMounted(() => {
    document.documentElement.classList.remove('dark')
    if (props.pageTitle) document.title = props.pageTitle
  })
</script>
