<template>
  <footer class="footer" id="about">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo">
            <span class="logo-icon">谱</span>
            {{ brand.name }}
          </div>
          <p v-html="footer.about" />
        </div>
        <div v-for="col in footer.columns" :key="col.title" class="footer-col">
          <h5>{{ col.title }}</h5>
          <ul>
            <li v-for="link in col.links" :key="link.label">
              <a :href="linkHref(link)" @click="onLink($event, link)">
                {{ link.label }}
                <span v-if="link.badge" class="footer-badge">{{ link.badge }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-bottom-meta">
          <p>{{ footer.copyright }}</p>
          <div class="footer-beian">
            <a
              v-for="item in footer.filings"
              :key="item.label"
              class="footer-beian-link"
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ArtSvgIcon v-if="item.icon" :icon="item.icon" class="footer-beian-icon" />
              {{ item.label }}
            </a>
          </div>
        </div>
        <div class="footer-links">
          <a v-for="link in footer.legal" :key="link.label" :href="link.href">{{ link.label }}</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { brand, footer } from '../copy'
  import { scrollToId } from '../composables/scrollToId'

  defineOptions({ name: 'LandingFooter' })

  type FooterLink = { label: string; to?: string; href?: string; badge?: string }

  const route = useRoute()
  const router = useRouter()

  const linkHref = (link: FooterLink) => link.to || link.href || '#'

  const onLink = async (e: Event, link: FooterLink) => {
    if (link.to) {
      e.preventDefault()
      await router.push(link.to)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const href = link.href || ''
    if (href.startsWith('mailto:') || href.startsWith('http')) return
    if (href.startsWith('/#')) {
      e.preventDefault()
      const id = href.slice(2)
      if (route.path === '/') scrollToId(id)
      else await router.push({ path: '/', hash: `#${id}` })
      return
    }
    if (href.startsWith('#')) {
      e.preventDefault()
      const id = href.slice(1)
      if (!id) return
      if (route.path === '/') scrollToId(id)
      else await router.push({ path: '/', hash: href })
    }
  }
</script>

<style scoped>
  .footer-badge {
    margin-left: 6px;
    font-size: 11px;
    color: var(--color-text-tertiary);
  }
</style>
