<template>
  <section class="section testimonials" id="testimonials">
    <div class="container">
      <div class="section-header fade-in">
        <span class="section-tag">{{ casesSection.tag }}</span>
        <h2 class="section-title">{{ casesSection.title }}</h2>
        <p class="section-desc">{{ casesSection.desc }}</p>
      </div>
      <div class="testimonials-grid">
        <div v-for="item in casesSection.items" :key="item.name" class="testimonial-card fade-in">
          <div class="testimonial-quote">"</div>
          <p class="testimonial-text">{{ item.quote }}</p>
          <div class="testimonial-author">
            <div class="author-avatar">{{ item.avatar }}</div>
            <div class="author-info">
              <h5>{{ item.name }}</h5>
              <p>{{ item.meta }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { casesSection } from '../copy'

  defineOptions({ name: 'LandingCases' })
</script>
