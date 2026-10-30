<template>
  <section class="hero">
    <div class="hero-pattern">传</div>
    <div class="container">
      <div class="hero-inner">
        <div class="hero-content fade-in">
          <h1>
            {{ hero.titleLine1 }}<br />
            <span class="accent">{{ hero.titleAccent }}</span>
          </h1>
          <p class="hero-subtitle">{{ hero.subtitle }}</p>
          <div class="hero-cta">
            <RouterLink class="btn btn-primary btn-lg" :to="{ name: 'Register' }">
              {{ hero.primaryCta }}
            </RouterLink>
            <a class="btn btn-secondary btn-lg" href="#features" @click.prevent="goFeatures">
              {{ hero.secondaryCta }}
            </a>
          </div>
          <div class="hero-trust">
            <div v-for="item in hero.trusts" :key="item" class="trust-item">
              <span class="check">
                <ArtSvgIcon icon="ri:check-line" class="text-[12px]" />
              </span>
              {{ item }}
            </div>
          </div>
        </div>

        <div class="hero-visual fade-in">
          <div class="hero-mockup">
            <div class="mockup-header">
              <span class="mockup-dot red" />
              <span class="mockup-dot yellow" />
              <span class="mockup-dot green" />
            </div>
            <div class="mockup-body">
              <div class="mockup-sidebar">
                <div class="mockup-sidebar-item active">族谱总览</div>
                <div class="mockup-sidebar-item">人物与世系</div>
                <div class="mockup-sidebar-item">修谱工作台</div>
                <div class="mockup-sidebar-item">资料档案</div>
                <div class="mockup-sidebar-item">设置与协作</div>
              </div>
              <div class="mockup-main">
                <div class="mockup-card">
                  <div class="mockup-card-title">修谱进度</div>
                  <div class="mockup-bar fill" />
                  <div class="mockup-bar" style="width: 40%" />
                  <div class="mockup-persons">
                    <div class="mockup-avatar" />
                    <div class="mockup-avatar" />
                    <div class="mockup-avatar" />
                    <div class="mockup-avatar" />
                    <div class="mockup-avatar" />
                  </div>
                </div>
                <div class="mockup-tree">
                  <div class="tree-node n1" />
                  <div class="tree-node n2" />
                  <div class="tree-node n3" />
                  <div class="tree-node n4" />
                  <div class="tree-node n5" />
                  <div class="tree-node n6" />
                  <div class="tree-node n7" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { hero } from '../copy'

  defineOptions({ name: 'LandingHero' })

  const router = useRouter()
  const goFeatures = () => router.push('/features')
</script>
