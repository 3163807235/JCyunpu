<!-- 自建族谱卡片：查看/复制/重置成员邀请码 · 专题 §6 / §7.2 -->
<template>
  <ElDialog
    :model-value="visible"
    title="族谱成员邀请码"
    width="440px"
    align-center
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
    @open="load"
  >
    <p class="text-xs text-g-500 mb-3">
      将此码发给族人，对方注册或登录后填写即可成为本谱<strong>成员（只读）</strong>。采编须在「角色管理」另行邀请。
    </p>
    <div v-loading="loading" class="min-h-16">
      <div v-if="invite" class="rounded-lg border border-g-200 bg-g-50 px-4 py-3 text-center">
        <p class="text-xs text-g-500 mb-1">
          {{ genealogyName
          }}<span v-if="genealogyNo" class="ml-1 font-mono">· {{ genealogyNo }}</span>
        </p>
        <p class="text-[11px] text-g-400 mb-2">下方为成员邀请码，不是族谱编号</p>
        <code class="text-2xl tracking-widest font-medium">{{ invite.code }}</code>
        <p class="text-xs text-g-400 mt-2">
          已使用 {{ invite.usedCount }}{{ invite.maxUses != null ? ` / ${invite.maxUses}` : '' }} 次
        </p>
      </div>
    </div>
    <template #footer>
      <ElButton :loading="rotating" :disabled="!invite" @click="onRotate">重置</ElButton>
      <ElButton type="primary" :disabled="!invite?.code" v-ripple @click="copyCode">
        复制邀请码
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchGenealogyInviteCode, fetchRotateGenealogyInviteCode } from '@/api/member'

  defineOptions({ name: 'InviteCodeDialog' })

  const props = defineProps<{
    visible: boolean
    genealogyId: number | null
    genealogyName?: string
    genealogyNo?: string
  }>()

  const emit = defineEmits<{ 'update:visible': [boolean] }>()

  const loading = ref(false)
  const rotating = ref(false)
  const invite = ref<Api.GenealogyMember.InviteCode | null>(null)

  const load = async () => {
    if (!props.genealogyId) return
    loading.value = true
    try {
      invite.value = await fetchGenealogyInviteCode(props.genealogyId)
    } catch (e: any) {
      invite.value = null
      ElMessage.error(e?.message || '加载邀请码失败')
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
    if (!props.genealogyId) return
    try {
      await ElMessageBox.confirm(
        '重置后旧码立即失效，已加入成员不受影响。确定重置？',
        '重置邀请码',
        { type: 'warning' }
      )
    } catch {
      return
    }
    rotating.value = true
    try {
      invite.value = await fetchRotateGenealogyInviteCode(props.genealogyId)
      ElMessage.success(`新邀请码：${invite.value.code}`)
    } catch (e: any) {
      ElMessage.error(e?.message || '重置失败')
    } finally {
      rotating.value = false
    }
  }
</script>
