<!-- 信息管理 · 人员列表 · v3.1.6 §3.4 页面 05 -->
<template>
  <div v-loading="!genealogyId" class="genealogy-info-persons h-full">
    <PersonListTab v-if="genealogyId" :genealogy-id="genealogyId" />
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import PersonListTab from '../collect/modules/person-list-tab.vue'

  defineOptions({ name: 'GenealogyInfoPersons' })
  useGenealogyContext()

  const route = useRoute()
  const genealogyId = computed(() => Number(route.params.id) || 0)
</script>
