<template>
  <section class="section features" id="features">
    <div class="container">
      <div class="section-header fade-in">
        <span class="section-tag">{{ featuresSection.tag }}</span>
        <h2 class="section-title">{{ featuresSection.title }}</h2>
        <p class="section-desc">{{ featuresSection.desc }}</p>
      </div>
      <div class="features-grid">
        <div v-for="item in featuresSection.items" :key="item.title" class="feature-card fade-in">
          <div class="feature-icon">
            <ArtSvgIcon :icon="item.icon" class="text-[26px]" />
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
          <a href="#features" class="feature-link" @click.prevent>了解更多</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { featuresSection } from '../copy'

  defineOptions({ name: 'LandingFeatures' })
</script>
