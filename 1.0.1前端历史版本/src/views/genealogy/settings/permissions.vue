<!-- 权限管理 · 权限设置 · v3.1.6 §3.4 页面 12 + 成员专题 §7.4 -->
<template>
  <StageShell
    title="权限设置"
    description="族谱基础信息、成员邀请码、隐私权限、在世脱敏、分享链接与操作日志"
    :tabs="tabs"
  >
    <template #tab-basic>
      <BasicSettingsTab />
    </template>
    <template #tab-members>
      <MemberInviteTab />
    </template>
    <template #tab-privacy>
      <PrivacySettingsTab />
    </template>
    <template #tab-logs>
      <OperationLogTab />
    </template>
  </StageShell>
</template>

<script setup lang="ts">
  import StageShell from '../modules/stage-shell.vue'
  import BasicSettingsTab from './modules/basic-settings-tab.vue'
  import MemberInviteTab from './modules/member-invite-tab.vue'
  import PrivacySettingsTab from './modules/privacy-settings-tab.vue'
  import OperationLogTab from './modules/operation-log-tab.vue'

  defineOptions({ name: 'GenealogySettingsPermissions' })

  const tabs = [
    { name: 'basic', label: '基础设置' },
    { name: 'members', label: '族谱成员' },
    { name: 'privacy', label: '隐私权限' },
    { name: 'logs', label: '操作日志' }
  ]
</script>
