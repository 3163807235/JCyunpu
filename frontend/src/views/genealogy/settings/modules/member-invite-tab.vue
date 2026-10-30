<!-- 族谱成员邀请 · 专题 §7.4 P1；≠ 角色管理邀请采编 -->
<template>
  <div v-loading="loading" class="member-invite-tab max-w-2xl">
    <ElAlert
      v-if="memberReadOnly"
      type="info"
      :closable="false"
      class="mb-4!"
      title="你当前为族谱成员（只读），无法管理邀请码与成员名单。"
    />

    <template v-else>
      <div class="flex items-center gap-1 mb-3 text-sm text-g-600">
        <span>族谱成员邀请</span>
        <PageTipIcon
          content="邀请码仅用于加入族谱成员（只读归属），不授予采编权限，不占用协作席位。采编请到「角色管理」邀请。"
        />
      </div>

      <div class="rounded-lg border border-g-200 p-4 mb-5">
        <p class="text-xs text-g-500 mb-2">当前有效邀请码</p>
        <div class="flex flex-wrap items-center gap-2">
          <code class="text-lg tracking-widest font-medium">{{ invite?.code || '—' }}</code>
          <ElButton size="small" :disabled="!invite?.code" @click="copyCode">复制</ElButton>
          <ElButton size="small" plain :loading="rotating" :disabled="!canEdit" @click="onRotate">
            重置
          </ElButton>
        </div>
        <p v-if="invite" class="text-xs text-g-400 mt-2">
          已使用 {{ invite.usedCount }}
          {{ invite.maxUses != null ? ` / ${invite.maxUses}` : '' }} 次 · Mock 演示也可用固定码
          YCDEMO01（演示谱）
        </p>
      </div>

      <div class="flex items-center gap-1 mb-3 text-sm text-g-600">
        <span>成员名单</span>
      </div>
      <ElTable :data="members" stripe border class="w-full">
        <ElTableColumn prop="userId" label="用户 ID" width="100" />
        <ElTableColumn label="来源" width="120">
          <template #default="{ row }">
            {{ sourceLabel(row.joinSource) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="inviteCodeUsed" label="使用邀请码" min-width="120" />
        <ElTableColumn prop="joinedAt" label="加入时间" min-width="160" />
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton link type="danger" :disabled="!canEdit" @click="onRemove(row)">
              移除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="!loading && !members.length" description="暂无族谱成员" class="mt-2" />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useRoute } from 'vue-router'
  import {
    fetchGenealogyInviteCode,
    fetchGenealogyMembers,
    fetchRemoveGenealogyMember,
    fetchRotateGenealogyInviteCode
  } from '@/api/member'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'

  defineOptions({ name: 'MemberInviteTab' })

  const route = useRoute()
  const { canEdit, memberReadOnly, refresh: refreshSub } = useSubscriptionGuard()

  const genealogyId = computed(() => Number(route.params.id))
  const loading = ref(false)
  const rotating = ref(false)
  const invite = ref<Api.GenealogyMember.InviteCode | null>(null)
  const members = ref<Api.GenealogyMember.Item[]>([])

  const sourceLabel = (s: Api.GenealogyMember.JoinSource) => {
    const map: Record<Api.GenealogyMember.JoinSource, string> = {
      register_invite: '注册带码',
      manual_code: '填码加入',
      owner_add: '拥有者添加'
    }
    return map[s] || s
  }

  const load = async () => {
    if (!genealogyId.value || memberReadOnly.value) return
    loading.value = true
    try {
      await refreshSub()
      const [code, list] = await Promise.all([
        fetchGenealogyInviteCode(genealogyId.value),
        fetchGenealogyMembers(genealogyId.value)
      ])
      invite.value = code
      members.value = list
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const copyCode = async () => {
    if (!invite.value?.code) return
    try {
      await navigator.clipboard.writeText(invite.value.code)
      ElMessage.success('已复制邀请码')
    } catch {
      ElMessage.warning(`请手动复制：${invite.value.code}`)
    }
  }

  const onRotate = async () => {
    try {
      await ElMessageBox.confirm(
        '重置后旧邀请码立即失效，已加入成员不受影响。确定重置？',
        '重置成员邀请码',
        { type: 'warning' }
      )
    } catch {
      return
    }
    rotating.value = true
    try {
      invite.value = await fetchRotateGenealogyInviteCode(genealogyId.value)
      ElMessage.success(`新邀请码：${invite.value.code}`)
    } catch (e: any) {
      ElMessage.error(e?.message || '重置失败')
    } finally {
      rotating.value = false
    }
  }

  const onRemove = async (row: Api.GenealogyMember.Item) => {
    try {
      await ElMessageBox.confirm(
        `移除用户 ${row.userId} 的成员身份？对方将无法再进入本谱（除非再次填码加入）。`,
        '移除成员',
        { type: 'warning' }
      )
      await fetchRemoveGenealogyMember(genealogyId.value, row.userId)
      ElMessage.success('已移除')
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '移除失败')
    }
  }

  watch(genealogyId, () => load(), { immediate: true })
</script>
