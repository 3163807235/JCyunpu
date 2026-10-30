<!-- 消息通知 · 顶部栏「查看全部」居中弹窗（原个人中心 Tab3 · §3.4 页面 14） -->
<template>
  <ElDialog
    v-model="visible"
    title="消息通知"
    width="720px"
    align-center
    append-to-body
    @opened="loadInvites"
  >
    <ElTabs v-model="messageFilter" type="card">
      <ElTabPane v-for="tab in messageTabs" :key="tab.value" :label="tab.label" :name="tab.value" />
    </ElTabs>

    <div v-loading="loading">
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
        <div class="flex items-center gap-1 shrink-0">
          <template v-if="item.inviteId">
            <ElButton
              link
              type="primary"
              :loading="actingId === item.inviteId"
              @click="acceptInvite(item)"
            >
              接受
            </ElButton>
            <ElButton
              link
              type="danger"
              :loading="actingId === item.inviteId"
              @click="rejectInvite(item)"
            >
              拒绝
            </ElButton>
          </template>
          <ElButton v-else-if="!item.read" link type="primary" @click="item.read = true">
            标为已读
          </ElButton>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
      <ElButton type="primary" plain v-ripple @click="markAllRead">全部已读</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchAcceptMyCollaboratorInvite,
    fetchMyCollaboratorInvites,
    fetchRejectMyCollaboratorInvite
  } from '@/api/collaborator'

  defineOptions({ name: 'MessageNoticeDialog' })

  const visible = defineModel<boolean>({ default: false })

  type MessageCategory = 'all' | 'system' | 'collab' | 'flow' | 'billing'

  interface MessageItem {
    id: number | string
    category: Exclude<MessageCategory, 'all'>
    categoryLabel: string
    title: string
    content: string
    time: string
    read: boolean
    /** 协作邀请待办：有值则可接受/拒绝 */
    inviteId?: number
    genealogyId?: number
  }

  const messageFilter = ref<MessageCategory>('all')
  const loading = ref(false)
  const actingId = ref<number | null>(null)

  const messageTabs = [
    { label: '全部', value: 'all' },
    { label: '系统通知', value: 'system' },
    { label: '协作通知', value: 'collab' },
    { label: '流程通知', value: 'flow' },
    { label: '续费提醒', value: 'billing' }
  ]

  const staticMessages = reactive<MessageItem[]>([
    {
      id: 3,
      category: 'flow',
      categoryLabel: '流程通知',
      title: '项目推进提醒',
      content: '可在工作台查看修谱阶段进度。',
      time: '—',
      read: true
    },
    {
      id: 4,
      category: 'system',
      categoryLabel: '系统通知',
      title: '版本更新说明',
      content: '家传云谱已更新修谱流程引导与额度展示。',
      time: '—',
      read: true
    }
  ])

  const inviteMessages = ref<MessageItem[]>([])

  const messages = computed(() => [...inviteMessages.value, ...staticMessages])

  const filteredMessages = computed(() => {
    if (messageFilter.value === 'all') return messages.value
    return messages.value.filter((m) => m.category === messageFilter.value)
  })

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      editor: '房头采编',
      chief_editor: '主编',
      reviewer: '校勘员',
      branch_manager: '分支负责人',
      viewer: '只读'
    }
    return map[role] || role
  }

  const loadInvites = async () => {
    loading.value = true
    try {
      const list = await fetchMyCollaboratorInvites()
      inviteMessages.value = (list || []).map((inv) => ({
        id: `invite-${inv.id}`,
        category: 'collab' as const,
        categoryLabel: '协作通知',
        title: `协作邀请：${inv.genealogyName}`,
        content: `${inv.inviterName} 邀请你以「${roleLabel(inv.role)}」加入，有效期至 ${inv.expireAt || '—'}`,
        time: inv.invitedAt || '—',
        read: false,
        inviteId: inv.id,
        genealogyId: inv.genealogyId
      }))
      if (inviteMessages.value.length && messageFilter.value === 'all') {
        messageFilter.value = 'collab'
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '加载协作邀请失败')
    } finally {
      loading.value = false
    }
  }

  const acceptInvite = async (item: MessageItem) => {
    if (!item.inviteId) return
    actingId.value = item.inviteId
    try {
      await fetchAcceptMyCollaboratorInvite(item.inviteId)
      ElMessage.success('已接受协作邀请，可在「我的族谱」进入')
      await loadInvites()
    } catch (e: any) {
      ElMessage.error(e?.message || '接受失败')
    } finally {
      actingId.value = null
    }
  }

  const rejectInvite = async (item: MessageItem) => {
    if (!item.inviteId) return
    actingId.value = item.inviteId
    try {
      await fetchRejectMyCollaboratorInvite(item.inviteId)
      ElMessage.success('已拒绝该协作邀请')
      await loadInvites()
    } catch (e: any) {
      ElMessage.error(e?.message || '拒绝失败')
    } finally {
      actingId.value = null
    }
  }

  const markAllRead = () => {
    staticMessages.forEach((m) => {
      m.read = true
    })
  }

  watch(visible, (v) => {
    if (v) loadInvites()
  })
</script>
