<template>
  <section class="section values" id="values">
    <div class="container">
      <div class="section-header fade-in">
        <span class="section-tag">{{ valuesSection.tag }}</span>
        <h2 class="section-title">{{ valuesSection.title }}</h2>
        <p class="section-desc">{{ valuesSection.desc }}</p>
      </div>
      <div class="values-grid">
        <div v-for="item in valuesSection.items" :key="item.title" class="value-card fade-in">
          <div class="value-icon">
            <ArtSvgIcon :icon="item.icon" class="text-[32px]" />
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { valuesSection } from '../copy'

  defineOptions({ name: 'LandingValues' })
</script>
