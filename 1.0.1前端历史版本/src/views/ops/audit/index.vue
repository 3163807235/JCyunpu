<!-- 审计日志 · §2.3 后台页面 06 Tab3 · 模块 N4：永久留存不可删 -->
<template>
  <div class="ops-audit art-full-height">
    <ArtSearchBar v-model="searchForm" :items="searchItems" @search="onSearch" @reset="onReset" />

    <ElCard class="art-table-card mt-3" shadow="never">
      <ArtTableHeader layout="refresh" :loading="loading" @refresh="load">
        <template #left>
          <span class="text-sm text-g-600 inline-flex items-center gap-1">
            审计日志
            <PageTipIcon
              content="审计日志永久留存，不可删除、不可篡改。覆盖冻结/解冻等后台人工操作。"
            />
          </span>
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

    <ElDialog v-model="detailVisible" title="审计详情" width="560px" align-center destroy-on-close>
      <template v-if="detail">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="时间">{{ detail.createdAt }}</ElDescriptionsItem>
          <ElDescriptionsItem label="管理员">{{ detail.adminName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="动作">{{ detail.action }}</ElDescriptionsItem>
          <ElDescriptionsItem label="对象">
            {{ detail.targetType }}
            <span v-if="detail.targetId != null"> #{{ detail.targetId }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="摘要">{{ detail.summary }}</ElDescriptionsItem>
          <ElDescriptionsItem label="IP">{{ detail.ipAddress }}</ElDescriptionsItem>
        </ElDescriptions>
        <pre
          v-if="detail.detail"
          class="mt-3 text-xs bg-g-100 p-3 rounded overflow-auto max-h-48"
          >{{ JSON.stringify(detail.detail, null, 2) }}</pre
        >
      </template>
      <template #footer>
        <ElButton type="primary" @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage } from 'element-plus'
  import { fetchOpsAuditList, type OpsAuditItem } from '@/api/ops'

  defineOptions({ name: 'OpsAudit' })

  const loading = ref(false)
  const records = ref<OpsAuditItem[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const searchForm = reactive({ keyword: '', action: '' })
  const detailVisible = ref(false)
  const detail = ref<OpsAuditItem | null>(null)

  const searchItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input' as const,
      placeholder: '摘要 / 管理员 / 动作',
      clearable: true
    },
    {
      label: '动作',
      key: 'action',
      type: 'select' as const,
      props: {
        clearable: true,
        options: [
          { label: '冻结用户', value: 'user.freeze' },
          { label: '解冻用户', value: 'user.unfreeze' },
          { label: '初始化', value: 'ops.bootstrap' }
        ]
      }
    }
  ])

  const columns = computed(() => [
    {
      prop: 'createdAt',
      label: '时间',
      width: 170,
      formatter: (r: OpsAuditItem) => r.createdAt
    },
    {
      prop: 'adminName',
      label: '管理员',
      width: 120,
      formatter: (r: OpsAuditItem) => r.adminName
    },
    {
      prop: 'action',
      label: '动作',
      width: 140,
      formatter: (r: OpsAuditItem) => r.action
    },
    {
      prop: 'summary',
      label: '摘要',
      minWidth: 200,
      formatter: (r: OpsAuditItem) => r.summary
    },
    {
      prop: 'ipAddress',
      label: 'IP',
      width: 120,
      formatter: (r: OpsAuditItem) => r.ipAddress
    },
    {
      prop: 'ops',
      label: '操作',
      width: 90,
      fixed: 'right' as const,
      formatter: (r: OpsAuditItem) =>
        h(ElButton, { link: true, type: 'primary', onClick: () => openDetail(r) }, () => '详情')
    }
  ])

  const load = async () => {
    loading.value = true
    try {
      const res = await fetchOpsAuditList({
        current: pagination.current,
        size: pagination.size,
        keyword: searchForm.keyword || undefined,
        action: searchForm.action || undefined
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
    searchForm.action = ''
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
  const openDetail = (row: OpsAuditItem) => {
    detail.value = row
    detailVisible.value = true
  }

  onMounted(load)
</script>
