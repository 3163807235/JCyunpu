<template>
  <section class="section cta-section" id="cta">
    <div class="container">
      <div class="cta-inner fade-in">
        <h2>{{ ctaSection.title }}</h2>
        <p v-html="ctaDescHtml" />
        <RouterLink class="btn btn-primary btn-lg" :to="{ name: 'Register' }">
          {{ ctaSection.button }}
        </RouterLink>
        <p class="cta-trust">{{ ctaSection.trust }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ctaSection } from '../copy'

  defineOptions({ name: 'LandingCta' })

  const ctaDescHtml = computed(() => ctaSection.desc.replace(/\n/g, '<br>'))
</script>
