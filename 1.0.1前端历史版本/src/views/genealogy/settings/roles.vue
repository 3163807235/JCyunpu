<!-- 权限管理 · 角色管理 · v3.1.6 §3.4 页面 12 / §1.7.16 / §1.9；列表页仅用 art-table-card -->
<template>
  <div v-loading="loading" class="roles-page art-full-height">
    <ElCard class="art-table-card !mb-0 !mt-0" shadow="never">
      <ArtTableHeader layout="refresh" :loading="loading" @refresh="load">
        <template #left>
          <ElSpace wrap>
            <span class="text-sm text-g-600 inline-flex items-center gap-1">
              协作席位 {{ usedSeats }} / {{ maxCollaborators }}
              <span class="text-g-400">（不含拥有者）</span>
              <PageTipIcon ariaLabel="协作规则说明">
                <p>
                  本页管理<strong>族谱长久协作权限</strong>（日常人丁维护也依赖此名单），与「项目启动
                  · 团队配置」的本期理事会名录相互独立。
                </p>
                <p class="mt-1">所有成员操作消耗族谱拥有者额度；一人仅一角色；邀请 7 天有效</p>
                <p class="mt-1"
                  >仅拥有者可邀请 / 移除；移除后立即失去访问，不自动改动本期组编名录</p
                >
              </PageTipIcon>
            </span>

            <ElPopover placement="bottom-start" :width="440" trigger="click" :show-arrow="true">
              <template #reference>
                <ElButton text>
                  <ArtSvgIcon icon="ri:shield-user-line" class="mr-1" />
                  权限说明
                </ElButton>
              </template>
              <div class="roles-perm-popover">
                <p class="text-sm font-medium mb-2">MVP 角色权限对照</p>
                <ElTable :data="permissionRows" size="small" border class="w-full">
                  <ElTableColumn prop="action" label="能力" min-width="150" />
                  <ElTableColumn label="拥有者" width="72" align="center">
                    <template #default="{ row }">
                      <ArtSvgIcon
                        :icon="row.owner ? 'ri:check-line' : 'ri:close-line'"
                        :class="row.owner ? 'text-[var(--el-color-success)]' : 'text-g-400'"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="采编" width="64" align="center">
                    <template #default="{ row }">
                      <ArtSvgIcon
                        :icon="row.editor ? 'ri:check-line' : 'ri:close-line'"
                        :class="row.editor ? 'text-[var(--el-color-success)]' : 'text-g-400'"
                      />
                    </template>
                  </ElTableColumn>
                </ElTable>
                <p class="mt-2 text-xs text-g-500">
                  主编、校勘员、分支负责人、只读浏览将在 V1.5 开放。
                </p>
              </div>
            </ElPopover>

            <ElButton type="primary" :disabled="!canInvite" v-ripple @click="openInvite">
              <ArtSvgIcon icon="ri:user-add-line" class="mr-1" />
              邀请采编
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>
      <ArtTable :loading="loading" :data="members" :columns="columns" />
    </ElCard>

    <ElDialog
      v-model="inviteVisible"
      title="邀请采编"
      width="440px"
      align-center
      destroy-on-close
      @closed="resetInvite"
    >
      <ElForm ref="inviteFormRef" :model="inviteForm" :rules="inviteRules" label-position="top">
        <ElFormItem label="角色">
          <ElInput model-value="房头采编" disabled />
          <p class="mt-1 text-xs text-g-500">MVP 仅可邀请采编；主编/校勘等角色 V1.5 开放</p>
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput v-model="inviteForm.phone" maxlength="11" placeholder="被邀请人 11 位手机号" />
        </ElFormItem>
        <ElFormItem label="显示名称" prop="displayName">
          <ElInput
            v-model="inviteForm.displayName"
            maxlength="32"
            placeholder="可选，默认「采编·后四位」"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="inviteVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="inviting" v-ripple @click="confirmInvite">
          发送邀请
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    ElButton,
    ElMessage,
    ElMessageBox,
    ElTag,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { useRoute } from 'vue-router'
  import {
    fetchAcceptCollaborator,
    fetchCollaboratorList,
    fetchInviteCollaborator,
    fetchRemoveCollaborator
  } from '@/api/collaborator'
  import { useUserStore } from '@/store/modules/user'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'

  defineOptions({ name: 'GenealogySettingsRoles' })

  useGenealogyContext()

  const route = useRoute()
  const userStore = useUserStore()
  const { canWrite, refresh: refreshSub } = useSubscriptionGuard()

  const loading = ref(false)
  const inviting = ref(false)
  const members = ref<Api.Collaborator.Item[]>([])
  const maxCollaborators = ref(1)
  const usedSeats = ref(0)
  const inviteVisible = ref(false)
  const inviteFormRef = ref<FormInstance>()
  const inviteForm = reactive({ phone: '', displayName: '' })

  const genealogyId = computed(() => Number(route.params.id))
  const canInvite = computed(() => canWrite.value && usedSeats.value < maxCollaborators.value)

  const ownerPayload = computed(() => {
    const info = userStore.getUserInfo
    return {
      userId: Number(info.userId) || 10001,
      displayName: info.nickName || info.userName || '拥有者',
      phone: info.phone || '13800138000'
    }
  })

  const permissionRows = [
    { action: '管理协作成员 / 隐私设置', owner: true, editor: false },
    { action: '新增 / 编辑 / 删除人物与关系', owner: true, editor: true },
    { action: '上传附件、字辈与章节编排', owner: true, editor: true },
    { action: '推进流程 / 终审 / 锁定排版', owner: true, editor: false },
    { action: '生成 PDF / 发布归档', owner: true, editor: false },
    { action: '查看额度与订阅', owner: true, editor: false }
  ]

  const roleLabel = (role: Api.Collaborator.Role) => {
    const map: Record<Api.Collaborator.Role, string> = {
      owner: '拥有者',
      chief_editor: '主编',
      editor: '采编',
      reviewer: '校勘员',
      branch_manager: '分支负责人',
      viewer: '只读'
    }
    return map[role] || role
  }

  const statusMeta = (status: Api.Collaborator.InviteStatus) => {
    const map: Record<
      Api.Collaborator.InviteStatus,
      { label: string; type: 'success' | 'warning' | 'info' | 'danger' }
    > = {
      0: { label: '待接受', type: 'warning' },
      1: { label: '已加入', type: 'success' },
      2: { label: '已拒绝', type: 'info' },
      3: { label: '已过期', type: 'danger' },
      4: { label: '已移除', type: 'info' }
    }
    return map[status]
  }

  const columns = computed(() => [
    {
      prop: 'displayName',
      label: '成员',
      minWidth: 140,
      formatter: (row: Api.Collaborator.Item) => row.displayName
    },
    {
      prop: 'phone',
      label: '手机号',
      width: 130,
      formatter: (row: Api.Collaborator.Item) => row.phone
    },
    {
      prop: 'role',
      label: '角色',
      width: 100,
      formatter: (row: Api.Collaborator.Item) => roleLabel(row.role)
    },
    {
      prop: 'inviteStatus',
      label: '状态',
      width: 100,
      formatter: (row: Api.Collaborator.Item) => {
        const meta = statusMeta(row.inviteStatus)
        return h(ElTag, { size: 'small', type: meta.type }, () => meta.label)
      }
    },
    {
      prop: 'expireAt',
      label: '邀请有效期',
      minWidth: 160,
      formatter: (row: Api.Collaborator.Item) =>
        row.inviteStatus === 0 ? row.expireAt || '—' : row.joinedAt || '—'
    },
    {
      prop: 'ops',
      label: '操作',
      width: 160,
      fixed: 'right' as const,
      formatter: (row: Api.Collaborator.Item) => {
        if (row.role === 'owner') {
          return h('span', { class: 'text-xs text-g-400' }, '—')
        }
        const nodes: ReturnType<typeof h>[] = []
        if (row.inviteStatus === 0 && canWrite.value) {
          nodes.push(
            h(
              ElButton,
              {
                link: true,
                type: 'primary',
                onClick: () => acceptInvite(row)
              },
              () => '模拟接受'
            )
          )
        }
        if ((row.inviteStatus === 0 || row.inviteStatus === 1) && canWrite.value) {
          nodes.push(
            h(
              ElButton,
              {
                link: true,
                type: 'danger',
                onClick: () => removeMember(row)
              },
              () => '移除'
            )
          )
        }
        if (row.inviteStatus === 3) {
          nodes.push(h('span', { class: 'text-xs text-g-400' }, '可重新邀请'))
        }
        return h('div', { class: 'flex gap-1' }, nodes)
      }
    }
  ])

  const inviteRules: FormRules = {
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
    ]
  }

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      await refreshSub()
      const data = await fetchCollaboratorList(genealogyId.value, ownerPayload.value)
      members.value = data.list
      maxCollaborators.value = data.maxCollaborators
      usedSeats.value = data.usedSeats
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const openInvite = () => {
    if (!canInvite.value) {
      ElMessage.warning(canWrite.value ? '协作人数已达上限，请升级套餐' : '订阅已过期，仅可只读')
      return
    }
    inviteVisible.value = true
  }

  const resetInvite = () => {
    inviteForm.phone = ''
    inviteForm.displayName = ''
    inviteFormRef.value?.resetFields()
  }

  const confirmInvite = async () => {
    const ok = await inviteFormRef.value?.validate().catch(() => false)
    if (!ok) return
    inviting.value = true
    try {
      await fetchInviteCollaborator(
        genealogyId.value,
        {
          phone: inviteForm.phone.trim(),
          displayName: inviteForm.displayName.trim() || undefined,
          role: 'editor'
        },
        ownerPayload.value.userId
      )
      ElMessage.success('邀请已发送（7 天内有效）')
      inviteVisible.value = false
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '邀请失败')
    } finally {
      inviting.value = false
    }
  }

  const acceptInvite = async (row: Api.Collaborator.Item) => {
    try {
      await fetchAcceptCollaborator(genealogyId.value, row.id)
      ElMessage.success('已模拟接受邀请')
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '操作失败')
    }
  }

  const removeMember = async (row: Api.Collaborator.Item) => {
    try {
      await ElMessageBox.confirm(
        `确定移除「${row.displayName}」？移除后对方将失去本谱访问权限。`,
        '移除协作成员',
        { type: 'warning', confirmButtonText: '移除', cancelButtonText: '取消' }
      )
      await fetchRemoveCollaborator(genealogyId.value, row.id)
      ElMessage.success('已移除')
      await load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '移除失败')
    }
  }

  watch(genealogyId, load, { immediate: true })
</script>

<style scoped lang="scss">
  .roles-perm-popover {
    :deep(.el-table) {
      --el-table-header-bg-color: var(--el-fill-color-light);
    }
  }
</style>
