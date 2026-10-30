<!-- 用户账号列表 · §2.3 后台页面 02 · 模块 N2：禁删，仅冻结/解冻 -->
<template>
  <div class="ops-users art-full-height">
    <ArtSearchBar v-model="searchForm" :items="searchItems" @search="onSearch" @reset="onReset" />

    <ElCard class="art-table-card mt-3" shadow="never">
      <ArtTableHeader layout="refresh" :loading="loading" @refresh="load">
        <template #left>
          <span class="text-sm text-g-500"
            >禁止删除用户账号；仅可冻结 / 解冻，操作写入审计日志</span
          >
        </template>
      </ArtTableHeader>
      <ArtTable
        :loading="loading"
        :data="records"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="onSizeChange"
        @pagination:current-change="onPageChange"
      />
    </ElCard>

    <ElDialog
      v-model="freezeVisible"
      title="冻结账号"
      width="440px"
      align-center
      destroy-on-close
    >
      <ElForm label-position="top">
        <ElFormItem label="冻结原因" required>
          <ElInput
            v-model="freezeReason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="将写入审计日志"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="freezeVisible = false">取消</ElButton>
        <ElButton type="danger" :loading="acting" v-ripple @click="confirmFreeze"
          >确认冻结</ElButton
        >
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import {
    fetchOpsFreezeUser,
    fetchOpsUnfreezeUser,
    fetchOpsUserList,
    type OpsUserItem
  } from '@/api/ops'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'OpsUsers' })

  const userStore = useUserStore()
  const adminName = computed(
    () => userStore.getUserInfo.nickName || userStore.getUserInfo.userName || '运营'
  )

  const loading = ref(false)
  const acting = ref(false)
  const records = ref<OpsUserItem[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const searchForm = reactive({ keyword: '', status: '' as '' | 'normal' | 'frozen', planType: '' })
  const freezeVisible = ref(false)
  const freezeReason = ref('')
  const freezeTarget = ref<OpsUserItem | null>(null)

  const searchItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input' as const,
      placeholder: '昵称 / 手机号 / ID',
      clearable: true
    },
    {
      label: '账号状态',
      key: 'status',
      type: 'select' as const,
      props: {
        clearable: true,
        options: [
          { label: '正常', value: 'normal' },
          { label: '冻结', value: 'frozen' }
        ]
      }
    },
    {
      label: '套餐',
      key: 'planType',
      type: 'select' as const,
      props: {
        clearable: true,
        options: [
          { label: '试用', value: 'trial' },
          { label: '基础', value: 'basic' },
          { label: '专业', value: 'pro' }
        ]
      }
    }
  ])

  const columns = computed(() => [
    { prop: 'id', label: '账号ID', width: 90, formatter: (r: OpsUserItem) => r.id },
    { prop: 'nickName', label: '昵称', minWidth: 120, formatter: (r: OpsUserItem) => r.nickName },
    { prop: 'phone', label: '手机号', width: 130, formatter: (r: OpsUserItem) => r.phone },
    {
      prop: 'planName',
      label: '套餐',
      width: 110,
      formatter: (r: OpsUserItem) => r.planName
    },
    {
      prop: 'expireAt',
      label: '到期',
      width: 160,
      formatter: (r: OpsUserItem) => r.expireAt || '—'
    },
    {
      prop: 'quota',
      label: '人物额度',
      width: 110,
      formatter: (r: OpsUserItem) => `${r.personUsed}/${r.personLimit}`
    },
    {
      prop: 'storage',
      label: '存储(MB)',
      width: 120,
      formatter: (r: OpsUserItem) => `${r.storageUsedMb}/${r.storageLimitMb}`
    },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      formatter: (r: OpsUserItem) =>
        h(ElTag, { size: 'small', type: r.status === 'frozen' ? 'danger' : 'success' }, () =>
          r.status === 'frozen' ? '冻结' : '正常'
        )
    },
    {
      prop: 'ops',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (r: OpsUserItem) =>
        h(
          ElButton,
          {
            link: true,
            type: r.status === 'frozen' ? 'primary' : 'danger',
            onClick: () => (r.status === 'frozen' ? unfreeze(r) : openFreeze(r))
          },
          () => (r.status === 'frozen' ? '解冻' : '冻结')
        )
    }
  ])

  const load = async () => {
    loading.value = true
    try {
      const res = await fetchOpsUserList({
        current: pagination.current,
        size: pagination.size,
        keyword: searchForm.keyword || undefined,
        status: searchForm.status || undefined,
        planType: searchForm.planType || undefined
      })
      records.value = res.records
      pagination.total = res.total
      pagination.current = res.current
      pagination.size = res.size
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const onSearch = () => {
    pagination.current = 1
    load()
  }
  const onReset = () => {
    searchForm.keyword = ''
    searchForm.status = ''
    searchForm.planType = ''
    pagination.current = 1
    load()
  }
  const onSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    load()
  }
  const onPageChange = (page: number) => {
    pagination.current = page
    load()
  }

  const openFreeze = (row: OpsUserItem) => {
    freezeTarget.value = row
    freezeReason.value = ''
    freezeVisible.value = true
  }

  const confirmFreeze = async () => {
    if (!freezeTarget.value) return
    if (!freezeReason.value.trim()) {
      ElMessage.warning('请填写冻结原因')
      return
    }
    acting.value = true
    try {
      await fetchOpsFreezeUser(freezeTarget.value.id, freezeReason.value, adminName.value)
      ElMessage.success('已冻结')
      freezeVisible.value = false
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '操作失败')
    } finally {
      acting.value = false
    }
  }

  const unfreeze = async (row: OpsUserItem) => {
    try {
      await ElMessageBox.confirm(`确定解冻「${row.nickName}」？`, '解冻账号', { type: 'warning' })
      await fetchOpsUnfreezeUser(row.id, adminName.value)
      ElMessage.success('已解冻')
      await load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '操作失败')
    }
  }

  onMounted(load)
</script>
