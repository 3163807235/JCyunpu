<template>
  <nav class="navbar" :class="{ scrolled }">
    <div class="container">
      <div class="nav-inner">
        <RouterLink class="logo" to="/" @click="menuOpen = false">
          <span class="logo-icon">谱</span>
          {{ brand.name }}
        </RouterLink>
        <ul class="nav-menu">
          <li v-for="link in nav.links" :key="link.label">
            <a :href="linkHref(link)" @click.prevent="go(link)">{{ link.label }}</a>
          </li>
        </ul>
        <div class="nav-actions">
          <RouterLink class="btn btn-ghost" :to="{ name: 'Login' }">{{ nav.login }}</RouterLink>
          <RouterLink class="btn btn-primary" :to="{ name: 'Register' }">{{
            nav.trial
          }}</RouterLink>
        </div>
        <button
          type="button"
          class="mobile-menu-btn"
          :aria-expanded="menuOpen"
          aria-label="打开菜单"
          @click="menuOpen = !menuOpen"
        >
          <ArtSvgIcon :icon="menuOpen ? 'ri:close-line' : 'ri:menu-line'" class="text-[24px]" />
        </button>
      </div>
      <div v-show="menuOpen" class="mobile-drawer">
        <a
          v-for="link in nav.links"
          :key="`m-${link.label}`"
          :href="linkHref(link)"
          @click.prevent="go(link, true)"
        >
          {{ link.label }}
        </a>
        <RouterLink :to="{ name: 'Login' }" @click="menuOpen = false">{{ nav.login }}</RouterLink>
        <RouterLink class="btn btn-primary" :to="{ name: 'Register' }" @click="menuOpen = false">
          {{ nav.trial }}
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { brand, nav } from '../copy'
  import { scrollToId } from '../composables/scrollToId'

  defineOptions({ name: 'LandingNav' })

  type NavLink = { label: string; to?: string; href?: string }

  const route = useRoute()
  const router = useRouter()
  const scrolled = ref(false)
  const menuOpen = ref(false)

  const linkHref = (link: NavLink) => link.to || link.href || '#'

  const go = async (link: NavLink, close = false) => {
    if (close) menuOpen.value = false
    if (link.to) {
      await router.push(link.to)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const href = link.href || ''
    if (href.startsWith('mailto:') || href.startsWith('http')) {
      window.location.href = href
      return
    }
    if (href.startsWith('/#')) {
      const id = href.slice(2)
      if (route.path === '/') {
        scrollToId(id)
      } else {
        await router.push({ path: '/', hash: `#${id}` })
      }
      return
    }
    if (href.startsWith('#')) {
      const id = href.slice(1)
      if (route.path === '/') scrollToId(id || 'top')
      else await router.push({ path: '/', hash: href })
    }
  }

  const onScroll = () => {
    scrolled.value = window.scrollY > 20
  }

  onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })
</script>

<style scoped>
  .mobile-drawer {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 8px 0 20px;
  }

  .mobile-drawer a {
    color: var(--color-text-secondary);
    font-size: 15px;
  }

  @media (width >= 769px) {
    .mobile-drawer {
      display: none !important;
    }
  }
</style>
