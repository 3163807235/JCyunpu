<!-- 关于我们 · 官网设计文档 §八 / 模块 O4 -->
<template>
  <LandingShell page-title="关于我们 - 家传云谱">
    <section class="page-hero fade-in">
      <div class="container">
        <span class="section-tag">关于我们</span>
        <h1>{{ aboutPage.hero.title }}</h1>
        <p>{{ aboutPage.hero.desc }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container about-story fade-in">
        <h2>{{ aboutPage.story.title }}</h2>
        <p v-for="(para, i) in aboutPage.story.paragraphs" :key="i">{{ para }}</p>
      </div>
    </section>

    <section class="section about-principles">
      <div class="container">
        <div class="values-grid">
          <div v-for="item in aboutPage.principles" :key="item.title" class="value-card fade-in">
            <div class="value-icon">
              <ArtSvgIcon :icon="item.icon" class="text-[28px]" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container fade-in">
        <h2 class="section-title" style="margin-bottom: 24px">{{ aboutPage.contact.title }}</h2>
        <div class="about-contact">
          <a
            v-for="item in aboutPage.contact.items"
            :key="item.label"
            class="about-contact__item"
            :href="item.href"
          >
            <span class="about-contact__label">{{ item.label }}</span>
            <span class="about-contact__value">{{ item.value }}</span>
          </a>
        </div>
      </div>
    </section>

    <section class="section cta-band">
      <div class="container fade-in text-center">
        <h2>{{ aboutPage.cta.title }}</h2>
        <RouterLink class="btn btn-primary" :to="{ name: 'Register' }">
          {{ aboutPage.cta.button }}
        </RouterLink>
      </div>
    </section>
  </LandingShell>
</template>

<script setup lang="ts">
  import LandingShell from '../components/LandingShell.vue'
  import { aboutPage } from '../copy'

  defineOptions({ name: 'LandingAboutPage' })
</script>
