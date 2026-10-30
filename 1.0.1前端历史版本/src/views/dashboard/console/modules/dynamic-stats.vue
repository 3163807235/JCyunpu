<template>
  <div class="art-card h-128 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>最新动态</h4>
        <p>近期<span class="text-success">+{{ list.length }}</span></p>
      </div>
    </div>

    <div class="h-9/10 mt-2 overflow-hidden">
      <ElScrollbar>
        <div
          class="py-3 border-b border-g-300 text-sm last:border-b-0"
          v-for="(item, index) in list"
          :key="index"
        >
          <span class="text-g-800 font-medium">{{ item.actor }}</span>
          <span class="mx-2 text-g-600">{{ item.action }}</span>
          <span class="text-theme">{{ item.target }}</span>
          <p class="text-xs text-g-500 mt-1">{{ item.time }}</p>
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface DynamicItem {
    actor: string
    action: string
    target: string
    time: string
  }

  /** 最新动态：人物 / 附件 / 版本 / 成员 · 产品文档 §3.4 页面 01 */
  const list = reactive<DynamicItem[]>([
    { actor: '你', action: '新增人物', target: '陈伯达', time: '今天 14:20' },
    { actor: '采编·阿明', action: '上传附件', target: '老照片-祠堂.jpg', time: '今天 11:05' },
    { actor: '你', action: '保存版本', target: '颍川陈氏族谱 v0.3', time: '昨天 19:40' },
    { actor: '主编·陈老师', action: '成员加入', target: '校勘员·小周', time: '昨天 16:12' },
    { actor: '你', action: '创建族谱', target: '陇西李氏支谱', time: '09-01 09:18' },
    { actor: '系统', action: '额度提醒', target: '人物额度已用 25%', time: '08-28 08:00' }
  ])
</script>
