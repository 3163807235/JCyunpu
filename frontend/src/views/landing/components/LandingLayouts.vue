<template>
  <section class="section layouts" id="layouts">
    <div class="container">
      <div class="section-header fade-in">
        <span class="section-tag">{{ layoutsSection.tag }}</span>
        <h2 class="section-title">{{ layoutsSection.title }}</h2>
        <p class="section-desc">{{ layoutsSection.desc }}</p>
      </div>
      <div class="layouts-grid">
        <div v-for="item in layoutsSection.items" :key="item.title" class="layout-card fade-in">
          <span class="layout-badge" :class="item.badgeClass">{{ item.badge }}</span>
          <div class="layout-preview">
            <div v-if="item.preview === 'dieji'" class="layout-preview-content">
              <strong>第一世</strong><br />
              始祖 · 讳某某<br />
              字某某，号某某<br />
              生一子：某某<br /><br />
              <strong>第二世</strong><br />
              某某公之子 · 讳某某
            </div>
            <div
              v-else-if="item.preview === 'sushi'"
              class="layout-preview-content layout-preview-content--mono"
            >
              世&emsp;&emsp;一&emsp;&emsp;世&emsp;&emsp;二<br />
              ┌───┴───┐<br />
              甲&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;乙<br />
              ┌─┴─┐&emsp;&emsp;┌─┴─┐<br />
              丙&ensp;丁&emsp;&emsp;戊&ensp;己
            </div>
            <div
              v-else-if="item.preview === 'oushi'"
              class="layout-preview-content"
              style="font-size: 11px; columns: 2; column-gap: 12px"
            >
              一世祖<br />某某公<br />子二<br /><br />
              二世长房<br />某某公<br />子一<br /><br />
              二世二房<br />某某公<br />子三
            </div>
            <div v-else class="layout-preview-content layout-preview-content--mono">
              &emsp;&emsp;&emsp;始祖<br />
              &emsp;&emsp;┌──┼──┐<br />
              &emsp;&emsp;甲&ensp;乙&ensp;丙<br />
              &ensp;┌─┤&emsp;&emsp;&emsp;├─┐<br />
              &ensp;丁&ensp;戊&emsp;&emsp;己&ensp;庚
            </div>
          </div>
          <div class="layout-info">
            <h4>{{ item.title }}</h4>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { layoutsSection } from '../copy'

  defineOptions({ name: 'LandingLayouts' })
</script>

<style scoped>
  .layout-preview-content--mono {
    font-size: 12px;
    line-height: 1.9;
    letter-spacing: 0.02em;
  }
</style>
