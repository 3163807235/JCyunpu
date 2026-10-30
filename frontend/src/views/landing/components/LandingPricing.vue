<template>
  <section class="section pricing" id="pricing">
    <div class="container">
      <div class="section-header fade-in">
        <span class="section-tag">{{ pricingSection.tag }}</span>
        <h2 class="section-title">{{ pricingSection.title }}</h2>
        <p class="section-desc">{{ pricingSection.desc }}</p>
      </div>
      <div class="pricing-grid">
        <div
          v-for="plan in pricingSection.plans"
          :key="plan.id"
          class="pricing-card fade-in"
          :class="{ featured: plan.featured }"
        >
          <div v-if="plan.badge" class="pricing-badge">{{ plan.badge }}</div>
          <div class="pricing-name">{{ plan.name }}</div>
          <div class="pricing-desc">{{ plan.desc }}</div>
          <div class="pricing-price">
            <div class="pricing-amount">
              {{ plan.amount }}<span v-if="plan.unit" class="unit">{{ plan.unit }}</span>
            </div>
            <div class="pricing-period">{{ plan.period }}</div>
          </div>
          <ul class="pricing-features">
            <li v-for="f in plan.features" :key="f.text" :class="{ disabled: f.disabled }">
              {{ f.text }}
            </li>
          </ul>
          <RouterLink class="btn" :class="plan.ctaClass" :to="{ name: 'Register' }">
            {{ plan.cta }}
          </RouterLink>
        </div>
      </div>
      <p class="pricing-note fade-in">{{ pricingSection.note }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { pricingSection } from '../copy'

  defineOptions({ name: 'LandingPricing' })
</script>
