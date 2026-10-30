<!-- 信息管理 · 字辈列表 · v3.1.6 §3.4 页面 05 -->
<template>
  <div v-loading="!genealogyId" class="genealogy-info-generation h-full">
    <GenerationTab v-if="genealogyId" :genealogy-id="genealogyId" />
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import GenerationTab from '../collect/modules/generation-tab.vue'

  defineOptions({ name: 'GenealogyInfoGeneration' })
  useGenealogyContext()

  const route = useRoute()
  const genealogyId = computed(() => Number(route.params.id) || 0)
</script>
