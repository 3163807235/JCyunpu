<template>
  <section class="section process" id="process">
    <div class="container">
      <div class="section-header fade-in">
        <span class="section-tag">{{ processSection.tag }}</span>
        <h2 class="section-title">{{ processSection.title }}</h2>
        <p class="section-desc">{{ processSection.desc }}</p>
      </div>
      <div class="process-flow fade-in">
        <div v-for="step in processSection.steps" :key="step.no" class="process-step">
          <div class="step-number">{{ step.no }}</div>
          <h4>{{ step.title }}</h4>
          <p>{{ step.desc }}</p>
        </div>
      </div>
      <div class="process-modes fade-in">
        <div v-for="mode in processSection.modes" :key="mode.strong" class="mode-badge">
          <strong>{{ mode.strong }}</strong>
          <span>{{ mode.text }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { processSection } from '../copy'

  defineOptions({ name: 'LandingSteps' })
</script>
