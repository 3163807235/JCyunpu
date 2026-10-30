<!-- 产品功能页 · 官网设计文档 §四 / 模块 O2 -->
<template>
  <LandingShell page-title="产品功能 - 家传云谱">
    <section class="page-hero fade-in">
      <div class="container">
        <span class="section-tag">产品功能</span>
        <h1>{{ featuresPage.hero.title }}</h1>
        <p>{{ featuresPage.hero.desc }}</p>
        <div class="feature-tabs">
          <a
            v-for="m in featuresPage.modules"
            :key="m.id"
            class="feature-tab"
            :href="`#mod-${m.id}`"
            @click.prevent="scrollTo(`mod-${m.id}`)"
          >
            {{ m.title }}
          </a>
        </div>
      </div>
    </section>

    <section
      v-for="(m, idx) in featuresPage.modules"
      :key="m.id"
      :id="`mod-${m.id}`"
      class="section feature-module"
      :class="{ alt: idx % 2 === 1 }"
    >
      <div class="container feature-module__grid fade-in">
        <div class="feature-module__copy">
          <div class="feature-module__icon">
            <ArtSvgIcon :icon="m.icon" class="text-[28px]" />
          </div>
          <h2>{{ m.title }}</h2>
          <p class="feature-module__value">{{ m.value }}</p>
          <ul class="feature-module__points">
            <li v-for="p in m.points" :key="p">{{ p }}</li>
          </ul>
        </div>
        <div class="feature-module__visual" aria-hidden="true">
          <div class="feature-mock">
            <div class="feature-mock__bar"> <span /><span /><span /> </div>
            <div class="feature-mock__body">
              <div class="feature-mock__title">{{ m.title }}</div>
              <div v-for="i in 3" :key="i" class="feature-mock__line" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section cta-band">
      <div class="container fade-in text-center">
        <h2>{{ featuresPage.cta.title }}</h2>
        <RouterLink class="btn btn-primary" :to="{ name: 'Register' }">
          {{ featuresPage.cta.button }}
        </RouterLink>
      </div>
    </section>
  </LandingShell>
</template>

<script setup lang="ts">
  import LandingShell from '../components/LandingShell.vue'
  import { featuresPage } from '../copy'
  import { scrollToId } from '../composables/scrollToId'

  defineOptions({ name: 'LandingFeaturesPage' })

  const scrollTo = (id: string) => scrollToId(id)
</script>
