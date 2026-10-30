<!-- 我的族谱 · 产品文档 §3.4 页面 02 + 成员专题 §7.2 -->
<template>
  <div class="app-page">
    <div class="art-card-sm p-5">
      <div class="flex-cb flex-wrap gap-3 mb-5">
        <div class="flex flex-wrap items-center gap-3">
          <ElInput
            v-model="keyword"
            clearable
            class="!w-64"
            placeholder="搜索族谱名 / 堂号 / 始祖"
            @keyup.enter="reload"
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:search-line" />
            </template>
          </ElInput>
          <ElButton @click="reload">查询</ElButton>
        </div>
        <div class="flex gap-2 flex-wrap">
          <ElButton @click="trashVisible = true">
            <ArtSvgIcon icon="ri:delete-bin-line" class="mr-1" />
            回收站
          </ElButton>
          <ElButton plain v-ripple @click="joinVisible = true">
            <ArtSvgIcon icon="ri:qr-code-line" class="mr-1" />
            邀请码加入
          </ElButton>
          <ElButton type="primary" :disabled="!canCreateGenealogy" v-ripple @click="openCreate">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            创建族谱
          </ElButton>
        </div>
      </div>

      <ElAlert
        v-if="expired"
        class="mb-4!"
        type="error"
        :closable="false"
        title="订阅已过期：仅可浏览族谱，禁止创建、编辑与删除。请前往会员订阅中心续费。"
      >
        <ElButton class="mt-2" type="primary" size="small" @click="goRenew">立即续费</ElButton>
      </ElAlert>
      <ElAlert
        v-else-if="quotaExhausted"
        class="mb-4!"
        type="warning"
        :closable="false"
        title="人物额度已用尽：禁止新建族谱；请扩容或清理回收站后再操作。"
      >
        <ElButton class="mt-2" type="primary" size="small" @click="goExpand">购买扩容</ElButton>
      </ElAlert>
      <ElAlert
        v-else-if="!canCreate && ownedCount > 0"
        class="mb-4!"
        type="info"
        :style="{ margin: '0 0 10px 0' }"
        :closable="false"
        title="已达自建族谱数量上限；邀请码加入的成员谱不占名额。新建请先移入回收站或升级套餐（V1.5）。"
      />

      <ElEmpty v-if="!loading && !list.length" description="暂无族谱，创建或使用邀请码加入">
        <div class="flex flex-wrap gap-2 justify-center">
          <ElButton type="primary" plain :disabled="!canCreateGenealogy" @click="openCreate">
            立即创建
          </ElButton>
          <ElButton plain @click="joinVisible = true">有邀请码？加入族谱</ElButton>
        </div>
      </ElEmpty>

      <ElRow v-else :gutter="16">
        <ElCol v-for="item in list" :key="item.id" :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
          <div
            class="genealogy-card art-card border border-g-200 mb-4"
            role="button"
            tabindex="0"
            @click="onEnter(item)"
            @keydown.enter.prevent="onEnter(item)"
          >
            <div class="genealogy-card__left">
              <div class="genealogy-card__mark" aria-hidden="true">{{ surnameMark(item) }}</div>
              <h3 class="genealogy-card__title" :title="item.name">{{ item.name }}</h3>
              <p class="genealogy-card__no">{{ displayGenealogyNo(item) }}</p>
            </div>

            <div class="genealogy-card__right">
              <div class="genealogy-card__tags">
                <ElTag
                  v-if="item.membership === 'member'"
                  size="small"
                  type="warning"
                  effect="plain"
                >
                  成员 · 只读
                </ElTag>
                <ElTag size="small" type="info" effect="plain">
                  {{ privacyLabel(item.privacy) }}
                </ElTag>
                <ElTag size="small" type="info" effect="plain">
                  {{ modeLabel(item.mode) }}
                </ElTag>
              </div>

              <dl class="genealogy-card__meta">
                <div class="genealogy-card__meta-row">
                  <dt>姓氏</dt>
                  <dd>{{ item.surname || '未设' }}</dd>
                </div>
                <div class="genealogy-card__meta-row">
                  <dt>堂号</dt>
                  <dd>{{ item.hallName || '未设' }}</dd>
                </div>
                <div class="genealogy-card__meta-row">
                  <dt>始祖</dt>
                  <dd>{{ item.ancestor || '未设' }}</dd>
                </div>
              </dl>

              <p class="genealogy-card__foot">
                人物 {{ item.personCount }} · 项目 {{ item.projectCount }} · {{ item.createdAt }}
              </p>
            </div>

            <div
              v-if="item.membership !== 'member'"
              class="genealogy-card__actions"
              @click.stop
              @keydown.stop
            >
              <ElDropdown
                trigger="click"
                :disabled="shareBusyId === item.id"
                @command="(cmd) => onCardCommand(String(cmd), item)"
              >
                <ElButton circle size="small" class="genealogy-card__more" aria-label="更多操作">
                  <ArtSvgIcon icon="ri:more-fill" />
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="share" :disabled="expired || shareBusyId === item.id">
                      <ArtSvgIcon icon="ri:share-forward-line" class="mr-1" />
                      分享只读链接
                    </ElDropdownItem>
                    <ElDropdownItem command="invite">
                      <ArtSvgIcon icon="ri:qr-code-line" class="mr-1" />
                      成员邀请码
                    </ElDropdownItem>
                    <ElDropdownItem command="edit" :disabled="expired">
                      <ArtSvgIcon icon="ri:edit-line" class="mr-1" />
                      编辑
                    </ElDropdownItem>
                    <ElDropdownItem command="delete" divided :disabled="expired">
                      <ArtSvgIcon icon="ri:delete-bin-line" class="mr-1" />
                      删除
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
          </div>
        </ElCol>
      </ElRow>

      <div v-if="total > size" class="flex justify-end mt-2">
        <ElPagination
          v-model:current-page="current"
          v-model:page-size="size"
          layout="total, prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </div>
    </div>

    <GenealogyFormDialog
      v-model:visible="formVisible"
      :edit-item="editItem"
      @success="onFormSuccess"
    />
    <GenealogyTrashDrawer v-model:visible="trashVisible" @restored="reload" />
    <JoinGenealogyDialog v-model:visible="joinVisible" @success="onJoinSuccess" />
    <InviteCodeDialog
      v-model:visible="inviteCodeVisible"
      :genealogy-id="inviteCodeGenealogyId"
      :genealogy-name="inviteCodeGenealogyName"
      :genealogy-no="inviteCodeGenealogyNo"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchGenealogyList,
    fetchSoftDeleteGenealogy,
    fetchSubscriptionSummary
  } from '@/api/genealogy'
  import { fetchCreateShareLink } from '@/api/share'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { useUserStore } from '@/store/modules/user'
  import { ensureGenealogyNo } from '@/utils/genealogy/genealogy-no'
  import { PRIVACY_LABELS } from '@/utils/genealogy/stage'
  import { mittBus } from '@/utils/sys'
  import GenealogyFormDialog from './modules/genealogy-form-dialog.vue'
  import GenealogyTrashDrawer from './modules/genealogy-trash-drawer.vue'
  import InviteCodeDialog from './modules/invite-code-dialog.vue'
  import JoinGenealogyDialog from '@/components/business/join-genealogy-dialog/index.vue'

  defineOptions({ name: 'AppGenealogies' })

  const genealogyStore = useGenealogyStore()
  const userStore = useUserStore()

  const list = ref<Api.Genealogy.Item[]>([])
  const loading = ref(false)
  const shareBusyId = ref<number | null>(null)
  const keyword = ref('')
  const current = ref(1)
  const size = ref(12)
  const total = ref(0)
  const maxCount = ref(1)
  const formVisible = ref(false)
  const trashVisible = ref(false)
  const joinVisible = ref(false)
  const inviteCodeVisible = ref(false)
  const inviteCodeGenealogyId = ref<number | null>(null)
  const inviteCodeGenealogyName = ref('')
  const inviteCodeGenealogyNo = ref('')
  const editItem = ref<Api.Genealogy.Item | null>(null)
  const expired = ref(false)
  const quotaExhausted = ref(false)

  /** 自建谱数量（不含成员谱）；分页下用当前页 owner 计数 + Mock 创建拦截兜底 */
  const ownedCount = computed(
    () => list.value.filter((i) => i.membership === 'owner' || !i.membership).length
  )
  const canCreate = computed(() => ownedCount.value < maxCount.value)
  const canCreateGenealogy = computed(
    () => canCreate.value && !expired.value && !quotaExhausted.value
  )

  const privacyLabel = (p: Api.Genealogy.Privacy) => PRIVACY_LABELS[p]
  const modeLabel = (mode: Api.Genealogy.Mode) =>
    mode === 'standard' ? '五步 · 标准成谱' : '快捷 · 简易成谱'
  const displayGenealogyNo = (item: Api.Genealogy.Item) => ensureGenealogyNo(item)
  const surnameMark = (item: Api.Genealogy.Item) => {
    const s = (item.surname || item.name || '谱').trim()
    return s.slice(0, 1) || '谱'
  }

  const goRenew = () => mittBus.emit('openSubscription', 'purchase')
  const goExpand = () => mittBus.emit('openSubscription', 'purchase')

  const load = async () => {
    loading.value = true
    try {
      const res = await fetchGenealogyList({
        current: current.value,
        size: size.value,
        keyword: keyword.value,
        scope: 'active'
      })
      list.value = res.records
      total.value = res.total
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const reload = () => {
    current.value = 1
    load()
  }

  const openCreate = () => {
    if (expired.value) {
      ElMessage.warning('订阅已过期，请先续费')
      return
    }
    if (quotaExhausted.value) {
      ElMessage.warning('人物额度已用尽，请先扩容')
      return
    }
    if (!canCreate.value) {
      ElMessage.warning(`最多创建 ${maxCount.value} 个族谱`)
      return
    }
    editItem.value = null
    formVisible.value = true
  }

  const openEdit = (item: Api.Genealogy.Item) => {
    editItem.value = item
    formVisible.value = true
  }

  const openInviteCode = (item: Api.Genealogy.Item) => {
    inviteCodeGenealogyId.value = item.id
    inviteCodeGenealogyName.value = item.name
    inviteCodeGenealogyNo.value = displayGenealogyNo(item)
    inviteCodeVisible.value = true
  }

  const onCardCommand = (cmd: string, item: Api.Genealogy.Item) => {
    if (cmd === 'share') onShare(item)
    else if (cmd === 'invite') openInviteCode(item)
    else if (cmd === 'edit') openEdit(item)
    else if (cmd === 'delete') onDelete(item)
  }

  const onEnter = async (item: Api.Genealogy.Item) => {
    await genealogyStore.enterGenealogy(item)
  }

  /** 生成族内只读分享链接并复制 · §1.8.6 / 模块 M */
  const onShare = async (item: Api.Genealogy.Item) => {
    if (expired.value) {
      ElMessage.warning('订阅已过期，仅可浏览')
      return
    }
    shareBusyId.value = item.id
    try {
      const userId = Number(userStore.getUserInfo.userId) || 10001
      const link = await fetchCreateShareLink({ genealogyId: item.id, expireDays: 30 }, userId)
      const url = `${window.location.origin}/s/${link.token}`
      try {
        await navigator.clipboard.writeText(url)
        ElMessage.success('已生成只读分享链接并复制到剪贴板')
      } catch {
        ElMessage.success(`分享链接：${url}`)
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '分享失败')
    } finally {
      shareBusyId.value = null
    }
  }

  const onDelete = async (item: Api.Genealogy.Item) => {
    try {
      await ElMessageBox.confirm(
        `确定将「${item.name}」移入回收站？30 天内可恢复；回收站内数据仍占用人物与存储额度。`,
        '删除族谱',
        { type: 'warning', confirmButtonText: '移入回收站' }
      )
      await fetchSoftDeleteGenealogy(item.id)
      if (genealogyStore.currentGenealogyId === item.id) {
        genealogyStore.exitGenealogy(false)
      }
      ElMessage.success('已移入回收站')
      reload()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }

  const onFormSuccess = () => {
    load()
  }

  const onJoinSuccess = () => {
    reload()
  }

  onMounted(async () => {
    try {
      const summary = await fetchSubscriptionSummary()
      maxCount.value = summary.maxGenealogyCount || 1
      expired.value = summary.status === 'expired'
      quotaExhausted.value = summary.personUsed >= summary.personLimit
    } catch {
      maxCount.value = 1
    }
    load()
  })
</script>

<style scoped lang="scss">
  .genealogy-card {
    position: relative;
    display: grid;
    /* 左栏略宽（姓氏印记 + 名称 + 编号），右栏收窄 */
    grid-template-columns: minmax(108px, 0.82fr) minmax(0, 1.18fr);
    min-height: 228px;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: color-mix(in srgb, var(--el-color-primary) 35%, var(--el-border-color));
      box-shadow: 0 6px 18px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }

    &__left,
    &__right {
      min-width: 0;
      padding: 16px 12px;
    }

    &__left {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: color-mix(in srgb, var(--el-color-primary) 5%, var(--el-bg-color));
      border-right: 1px solid var(--el-border-color-lighter);
    }

    &__right {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      /* 给右上操作区留空，避免标签被遮挡 */
      padding-right: 40px;
    }

    &__mark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin-bottom: 10px;
      border-radius: 50%;
      font-size: 22px;
      font-weight: 600;
      line-height: 1;
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
      border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    }

    &__title {
      max-width: 100%;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.35;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__no {
      margin: 6px 0 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
      letter-spacing: 0.04em;
      color: var(--el-text-color-secondary);
    }

    &__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    &__meta {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    &__meta-row {
      display: grid;
      grid-template-columns: 36px 1fr;
      gap: 8px;
      align-items: baseline;
      font-size: 14px;
      line-height: 1.4;

      dt {
        margin: 0;
        color: var(--el-text-color-secondary);
      }

      dd {
        margin: 0;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: right;
      }
    }

    &__foot {
      margin: 0;
      font-size: 13px;
      line-height: 1.35;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__actions {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      cursor: default;
    }

    &__more {
      opacity: 0.72;
      transition: opacity 0.15s;

      &:hover,
      &:focus-visible {
        opacity: 1;
      }
    }

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      min-height: 0;

      &__left {
        border-right: none;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      &__right {
        padding-right: 12px;
        padding-top: 40px;
      }
    }
  }
</style>
