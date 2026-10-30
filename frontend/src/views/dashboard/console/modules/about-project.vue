<template>
  <div class="art-card p-5 flex-b mb-5 max-sm:mb-4">
    <div>
      <h2 class="text-2xl font-medium">关于 {{ systemName }}</h2>
      <p class="text-g-700 mt-1">面向家族修谱与数字传承的 SaaS 平台</p>
      <p class="text-g-700 mt-1">支持标准五步成谱与简易快捷成谱，订阅与额度统一管控</p>
      <p class="text-g-700 mt-1">技术栈：Vue3、TypeScript、Vite、Element Plus（基于 Art Design Pro）</p>
    </div>
    <img class="w-75 max-md:!hidden" src="@imgs/draw/draw1.png" alt="draw1" />
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'

  const systemName = AppConfig.systemInfo.name
</script>
