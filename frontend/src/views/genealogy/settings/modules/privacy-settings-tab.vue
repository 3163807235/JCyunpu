<!-- 隐私权限 · §1.8 / §3.4 页面 12 + 模块 M 分享 -->
<template>
  <div v-loading="loading" class="privacy-settings-tab max-w-2xl">
    <div class="flex items-center gap-1 mb-3 text-sm text-g-600">
      <span>隐私与脱敏</span>
      <PageTipIcon
        content="仅拥有者可修改隐私模式与在世脱敏。公开浏览者始终按最严格脱敏；拥有者本人查看不受脱敏限制。"
      />
    </div>

    <ElForm label-position="top">
      <ElFormItem label="族谱隐私模式">
        <ElRadioGroup
          v-model="form.privacy"
          :disabled="!canEdit"
          class="!flex !flex-col items-start gap-2"
        >
          <ElRadio :value="1">
            <span class="font-medium">完全私有</span>
            <span class="ml-2 text-xs text-g-500">仅拥有者与协作成员可访问</span>
          </ElRadio>
          <ElRadio :value="2">
            <span class="font-medium">族内可见</span>
            <span class="ml-2 text-xs text-g-500">可通过族内浏览链接只读访问</span>
          </ElRadio>
          <ElRadio :value="3">
            <span class="font-medium">全网公开</span>
            <span class="ml-2 text-xs text-g-500">无需登录可浏览公开内容（在世仍脱敏）</span>
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="在世人物脱敏级别">
        <ElRadioGroup
          v-model="form.livingDesensitize"
          :disabled="!canEdit"
          class="!flex !flex-col items-start gap-2"
        >
          <ElRadio :value="1">
            <span class="font-medium">严格脱敏</span>
            <span class="ml-2 text-xs text-g-500">隐藏生卒月日，仅名讳 + 享年范围（默认）</span>
          </ElRadio>
          <ElRadio :value="2">
            <span class="font-medium">中度脱敏</span>
            <span class="ml-2 text-xs text-g-500">仅显示生卒年份</span>
          </ElRadio>
          <ElRadio :value="3">
            <span class="font-medium">完整显示</span>
            <span class="ml-2 text-xs text-g-500">完整生卒仅对拥有者生效，其他角色仍脱敏</span>
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>

    <div class="mb-6">
      <ElButton type="primary" :loading="saving" :disabled="!canEdit" v-ripple @click="save">
        保存隐私设置
      </ElButton>
    </div>

    <div class="art-card-sm p-4">
      <div class="flex items-center gap-2 mb-2">
        <ArtSvgIcon icon="ri:share-line" class="text-theme text-lg" />
        <h3 class="text-base font-medium">族内分享链接</h3>
      </div>
      <p class="text-sm text-g-500 mb-3">
        生成不可猜测 token；默认可选 7/30/90 天或永久；可随时撤销。链接仅只读，访客按最严格脱敏。
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <ElSelect v-model="expireDays" class="!w-40" :disabled="!canEdit">
          <ElOption :value="7" label="7 天" />
          <ElOption :value="30" label="30 天" />
          <ElOption :value="90" label="90 天" />
          <ElOption :value="0" label="永久" />
        </ElSelect>
        <ElButton
          type="primary"
          plain
          :disabled="!canEdit"
          :loading="linkBusy"
          v-ripple
          @click="createLink"
        >
          <ArtSvgIcon icon="ri:link" class="mr-1" />
          生成分享链接
        </ElButton>
      </div>

      <ElTable :data="links" size="small" empty-text="暂无分享链接">
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag size="small" :type="linkStatus(row).type">{{ linkStatus(row).label }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="链接" min-width="200">
          <template #default="{ row }">
            <span class="text-xs break-all">{{ shareUrl(row.token) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="有效期" width="160">
          <template #default="{ row }">{{ row.expireAt || '永久' }}</template>
        </ElTableColumn>
        <ElTableColumn label="访问" width="70">
          <template #default="{ row }">{{ row.accessCount || 0 }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="copyLink(row)">复制</ElButton>
            <ElButton
              link
              type="danger"
              :disabled="!canEdit || !!row.revokedAt"
              @click="revokeLink(row)"
            >
              撤销
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useRoute } from 'vue-router'
  import { fetchGenealogyDetail, fetchUpdateGenealogy } from '@/api/genealogy'
  import { fetchCreateShareLink, fetchRevokeShareLink, fetchShareLinkList } from '@/api/share'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { useUserStore } from '@/store/modules/user'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'

  defineOptions({ name: 'PrivacySettingsTab' })

  const route = useRoute()
  const genealogyStore = useGenealogyStore()
  const userStore = useUserStore()
  const { canEdit, refresh: refreshSub } = useSubscriptionGuard()

  const genealogyId = computed(() => Number(route.params.id))
  const userId = computed(() => Number(userStore.getUserInfo.userId) || 10001)
  const loading = ref(false)
  const saving = ref(false)
  const linkBusy = ref(false)
  const links = ref<Api.ShareLink.Item[]>([])
  const expireDays = ref<Api.ShareLink.ExpirePreset>(90)

  const form = reactive({
    privacy: 2 as Api.Genealogy.Privacy,
    livingDesensitize: 1 as Api.Genealogy.LivingDesensitize
  })

  const shareUrl = (token: string) => `${window.location.origin}/s/${token}`

  const linkStatus = (row: Api.ShareLink.Item) => {
    if (row.revokedAt) return { label: '已撤销', type: 'info' as const }
    if (row.expireAt && row.expireAt < new Date().toISOString().slice(0, 19).replace('T', ' ')) {
      return { label: '已过期', type: 'danger' as const }
    }
    return { label: '有效', type: 'success' as const }
  }

  const loadLinks = async () => {
    links.value = await fetchShareLinkList(genealogyId.value)
  }

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      await refreshSub()
      const item = await fetchGenealogyDetail(genealogyId.value)
      form.privacy = item.privacy
      form.livingDesensitize = item.livingDesensitize ?? 1
      await loadLinks()
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const save = async () => {
    saving.value = true
    try {
      const item = await fetchUpdateGenealogy(genealogyId.value, {
        privacy: form.privacy,
        livingDesensitize: form.livingDesensitize
      })
      await genealogyStore.refreshFromServer(item.id)
      ElMessage.success('隐私设置已保存')
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  const createLink = async () => {
    linkBusy.value = true
    try {
      const item = await fetchCreateShareLink(
        { genealogyId: genealogyId.value, expireDays: expireDays.value },
        userId.value
      )
      await loadLinks()
      const url = shareUrl(item.token)
      try {
        await navigator.clipboard.writeText(url)
        ElMessage.success('已生成并复制到剪贴板')
      } catch {
        ElMessage.success(`已生成：${url}`)
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '生成失败')
    } finally {
      linkBusy.value = false
    }
  }

  const copyLink = async (row: Api.ShareLink.Item) => {
    try {
      await navigator.clipboard.writeText(shareUrl(row.token))
      ElMessage.success('已复制')
    } catch {
      ElMessage.info(shareUrl(row.token))
    }
  }

  const revokeLink = async (row: Api.ShareLink.Item) => {
    try {
      await ElMessageBox.confirm('撤销后链接立即失效，是否继续？', '撤销分享链接', {
        type: 'warning'
      })
      await fetchRevokeShareLink(row.id, userId.value)
      ElMessage.success('已撤销')
      await loadLinks()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '撤销失败')
    }
  }

  watch(genealogyId, load, { immediate: true })
</script>
