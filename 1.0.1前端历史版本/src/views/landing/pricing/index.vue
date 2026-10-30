<!-- 定价页 · 官网设计文档 §五 / 模块 O3 -->
<template>
  <LandingShell page-title="定价方案 - 家传云谱">
    <section class="page-hero fade-in">
      <div class="container">
        <span class="section-tag">定价方案</span>
        <h1>{{ pricingPage.hero.title }}</h1>
        <p>{{ pricingPage.hero.desc }}</p>
      </div>
    </section>

    <LandingPricing />

    <section class="section compare-section">
      <div class="container">
        <div class="section-header fade-in">
          <h2 class="section-title">{{ pricingPage.compareTitle }}</h2>
        </div>
        <div class="compare-table-wrap fade-in">
          <table class="compare-table">
            <thead>
              <tr>
                <th>权益项</th>
                <th>试用套餐</th>
                <th>基础年付</th>
                <th>专业年付</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pricingPage.compareRows" :key="row.name">
                <td>{{ row.name }}</td>
                <td>{{ row.trial }}</td>
                <td>{{ row.basic }}</td>
                <td>{{ row.pro }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section enterprise-section">
      <div class="container enterprise-card fade-in">
        <div>
          <h2>{{ pricingPage.enterprise.title }}</h2>
          <p>{{ pricingPage.enterprise.desc }}</p>
          <ul>
            <li v-for="p in pricingPage.enterprise.points" :key="p">{{ p }}</li>
          </ul>
        </div>
        <a class="btn btn-primary" :href="pricingPage.enterprise.mailto">
          {{ pricingPage.enterprise.cta }}
        </a>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header fade-in">
          <span class="section-tag">常见问题</span>
          <h2 class="section-title">计费相关</h2>
        </div>
        <div class="pricing-faq fade-in">
          <details v-for="item in pricingPage.faqs" :key="item.q" class="pricing-faq__item">
            <summary>{{ item.q }}</summary>
            <p>{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>
  </LandingShell>
</template>

<script setup lang="ts">
  import LandingShell from '../components/LandingShell.vue'
  import LandingPricing from '../components/LandingPricing.vue'
  import { pricingPage } from '../copy'

  defineOptions({ name: 'LandingPricingPage' })
</script>
