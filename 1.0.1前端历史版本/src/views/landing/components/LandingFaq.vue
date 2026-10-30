<template>
  <section class="section faq" id="faq">
    <div class="container">
      <div class="section-header fade-in">
        <span class="section-tag">{{ faqSection.tag }}</span>
        <h2 class="section-title">{{ faqSection.title }}</h2>
        <p class="section-desc">{{ faqSection.desc }}</p>
      </div>
      <div class="faq-container">
        <div
          v-for="(item, index) in faqSection.items"
          :key="item.q"
          class="faq-item fade-in"
          :class="{ active: activeIndex === index }"
        >
          <div class="faq-question" @click="toggle(index)">
            <span>{{ item.q }}</span>
            <span class="faq-toggle" />
          </div>
          <div class="faq-answer">
            <p>{{ item.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { faqSection } from '../copy'

  defineOptions({ name: 'LandingFaq' })

  const activeIndex = ref(0)

  const toggle = (index: number) => {
    activeIndex.value = activeIndex.value === index ? -1 : index
  }
</script>
