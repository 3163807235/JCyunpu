<template>
  <div id="top" ref="rootRef" class="landing-page">
    <LandingNav />
    <main>
      <LandingHero />
      <LandingValues />
      <LandingSteps />
      <LandingFeatures />
      <LandingLayouts />
      <LandingCases />
      <LandingPricing />
      <LandingFaq />
      <LandingCta />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
  import './styles/landing.css'
  import LandingNav from './components/LandingNav.vue'
  import LandingHero from './components/LandingHero.vue'
  import LandingValues from './components/LandingValues.vue'
  import LandingSteps from './components/LandingSteps.vue'
  import LandingFeatures from './components/LandingFeatures.vue'
  import LandingLayouts from './components/LandingLayouts.vue'
  import LandingCases from './components/LandingCases.vue'
  import LandingPricing from './components/LandingPricing.vue'
  import LandingFaq from './components/LandingFaq.vue'
  import LandingCta from './components/LandingCta.vue'
  import LandingFooter from './components/LandingFooter.vue'
  import { useFadeIn } from './composables/useFadeIn'
  import { scrollToId } from './composables/scrollToId'
  import { useRoute } from 'vue-router'

  defineOptions({ name: 'LandingPage' })

  const route = useRoute()
  const rootRef = ref<HTMLElement | null>(null)
  useFadeIn(rootRef)

  onMounted(() => {
    document.documentElement.classList.remove('dark')
    document.title = '家传云谱 - 让修谱从此简单，让家族记忆永续传承'
    if (route.hash) {
      nextTick(() => {
        const id = route.hash.replace(/^#/, '')
        if (id) scrollToId(id)
      })
    }
  })

  watch(
    () => route.hash,
    (hash) => {
      if (!hash) return
      nextTick(() => scrollToId(hash.replace(/^#/, '')))
    }
  )
</script>
