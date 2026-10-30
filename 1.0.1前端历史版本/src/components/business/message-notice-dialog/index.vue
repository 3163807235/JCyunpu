<!-- 消息通知 · 顶部栏「查看全部」居中弹窗（原个人中心 Tab3 · §3.4 页面 14） -->
<template>
  <ElDialog v-model="visible" title="消息通知" width="720px" align-center append-to-body>
    <ElTabs v-model="messageFilter" type="card">
      <ElTabPane v-for="tab in messageTabs" :key="tab.value" :label="tab.label" :name="tab.value" />
    </ElTabs>

    <ElEmpty v-if="!filteredMessages.length" description="暂无消息" />

    <div
      v-for="item in filteredMessages"
      :key="item.id"
      class="flex-cb gap-3 py-3 border-b border-g-300 last:border-b-0"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span
            v-if="!item.read"
            class="size-2 rounded-full bg-[var(--el-color-danger)] shrink-0"
          />
          <p class="text-sm font-medium truncate">{{ item.title }}</p>
          <ElTag size="small" type="info">{{ item.categoryLabel }}</ElTag>
        </div>
        <p class="text-xs text-g-500 mt-1">{{ item.time }} · {{ item.content }}</p>
      </div>
      <ElButton v-if="!item.read" link type="primary" @click="item.read = true">标为已读</ElButton>
    </div>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
      <ElButton type="primary" plain v-ripple @click="markAllRead">全部已读</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  defineOptions({ name: 'MessageNoticeDialog' })

  const visible = defineModel<boolean>({ default: false })

  type MessageCategory = 'all' | 'system' | 'collab' | 'flow' | 'billing'

  interface MessageItem {
    id: number
    category: Exclude<MessageCategory, 'all'>
    categoryLabel: string
    title: string
    content: string
    time: string
    read: boolean
  }

  const messageFilter = ref<MessageCategory>('all')

  const messageTabs = [
    { label: '全部', value: 'all' },
    { label: '系统通知', value: 'system' },
    { label: '协作通知', value: 'collab' },
    { label: '流程通知', value: 'flow' },
    { label: '续费提醒', value: 'billing' }
  ]

  const messages = reactive<MessageItem[]>([
    {
      id: 1,
      category: 'billing',
      categoryLabel: '续费提醒',
      title: '试用即将到期',
      content: '试用套餐将于 2026-10-14 到期，请及时续费以免影响新建与高阶能力。',
      time: '今天 09:00',
      read: false
    },
    {
      id: 2,
      category: 'collab',
      categoryLabel: '协作通知',
      title: '成员加入邀请',
      content: '校勘员·小周已接受「颍川陈氏族谱」协作邀请。',
      time: '昨天 16:12',
      read: false
    },
    {
      id: 3,
      category: 'flow',
      categoryLabel: '流程通知',
      title: '项目推进提醒',
      content: '「颍川陈氏族谱」可推进至内容编排阶段。',
      time: '昨天 10:30',
      read: true
    },
    {
      id: 4,
      category: 'system',
      categoryLabel: '系统通知',
      title: '版本更新说明',
      content: '家传云谱已更新修谱流程引导与额度展示。',
      time: '09-10 08:00',
      read: true
    }
  ])

  const filteredMessages = computed(() => {
    if (messageFilter.value === 'all') return messages
    return messages.filter((m) => m.category === messageFilter.value)
  })

  const markAllRead = () => {
    messages.forEach((m) => {
      m.read = true
    })
  }
</script>
