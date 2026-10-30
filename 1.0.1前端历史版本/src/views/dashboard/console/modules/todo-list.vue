<template>
  <div class="art-card h-128 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>待办提醒</h4>
        <p>待处理<span class="text-danger">{{ pendingCount }}</span></p>
      </div>
    </div>

    <div class="h-[calc(100%-40px)] overflow-auto">
      <ElScrollbar>
        <div
          class="flex-cb h-17.5 border-b border-g-300 text-sm last:border-b-0"
          v-for="(item, index) in list"
          :key="index"
        >
          <div class="min-w-0 pr-3">
            <p class="text-sm truncate">{{ item.title }}</p>
            <p class="text-g-500 mt-1">{{ item.date }}</p>
          </div>
          <ElCheckbox v-model="item.done" />
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface TodoItem {
    title: string
    date: string
    done: boolean
  }

  const list = reactive<TodoItem[]>([
    { title: '完善颍川陈氏族谱始祖信息', date: '今天', done: false },
    { title: '审核采编上传的 3 份附件', date: '今天', done: false },
    { title: '邀请校勘员加入当前项目', date: '本周', done: false },
    { title: '查看试用到期提醒', date: '到期前 7 天', done: true },
    { title: '核对人物额度占用', date: '本周', done: true }
  ])

  const pendingCount = computed(() => list.filter((i) => !i.done).length)
</script>
