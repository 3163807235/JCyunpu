<!-- 订单列表 · §2.3 后台页面 04 Tab2 · 模块 N3 -->
<template>
  <div class="ops-orders art-full-height">
    <ArtSearchBar v-model="searchForm" :items="searchItems" @search="onSearch" @reset="onReset" />

    <ElCard class="art-table-card mt-3" shadow="never">
      <ArtTableHeader layout="refresh" :loading="loading" @refresh="load" />
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
      v-model="detailVisible"
      title="订单详情"
      width="520px"
      align-center
      destroy-on-close
    >
      <template v-if="detail">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="订单号">{{ detail.orderNo }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户">
            {{ detail.userNick }} / {{ detail.userPhone }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="商品">{{ detail.productName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="金额">¥{{ detail.amount }}</ElDescriptionsItem>
          <ElDescriptionsItem label="支付方式">
            {{ payMethodLabel(detail.paymentMethod) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            {{ payStatusLabel(detail.paymentStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">{{ detail.createdAt }}</ElDescriptionsItem>
          <ElDescriptionsItem label="支付时间">{{ detail.paidAt || '—' }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
      <template #footer>
        <ElButton type="primary" @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage, ElTag } from 'element-plus'
  import { fetchOpsOrderList } from '@/api/ops'

  defineOptions({ name: 'OpsOrders' })

  type AdminOrder = Api.Subscription.OrderItem & { userNick?: string; userPhone?: string }

  const loading = ref(false)
  const records = ref<AdminOrder[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const searchForm = reactive<{ paymentStatus: Api.Subscription.PaymentStatus | '' }>({
    paymentStatus: ''
  })
  const detailVisible = ref(false)
  const detail = ref<AdminOrder | null>(null)

  const payStatusLabel = (s: Api.Subscription.PaymentStatus) =>
    ({ 0: '待支付', 1: '已支付', 2: '已取消', 3: '已退款', 4: '超时' })[s] || String(s)

  const payMethodLabel = (m?: Api.Subscription.PaymentMethod) =>
    ({ wechat: '微信', alipay: '支付宝', balance: '余额', manual: '人工' })[m || ''] || '—'

  const statusTagType = (
    s: Api.Subscription.PaymentStatus
  ): 'success' | 'warning' | 'info' | 'danger' => {
    if (s === 1) return 'success'
    if (s === 0) return 'warning'
    if (s === 3) return 'danger'
    return 'info'
  }

  const searchItems = computed(() => [
    {
      label: '支付状态',
      key: 'paymentStatus',
      type: 'select' as const,
      props: {
        clearable: true,
        options: [
          { label: '待支付', value: 0 },
          { label: '已支付', value: 1 },
          { label: '已取消', value: 2 },
          { label: '已退款', value: 3 },
          { label: '超时', value: 4 }
        ]
      }
    }
  ])

  const columns = computed(() => [
    {
      prop: 'orderNo',
      label: '订单号',
      minWidth: 160,
      formatter: (r: AdminOrder) => r.orderNo
    },
    {
      prop: 'user',
      label: '用户',
      minWidth: 140,
      formatter: (r: AdminOrder) => `${r.userNick || '—'} ${r.userPhone || ''}`
    },
    {
      prop: 'productName',
      label: '套餐/商品',
      minWidth: 140,
      formatter: (r: AdminOrder) => r.productName
    },
    {
      prop: 'amount',
      label: '金额',
      width: 100,
      formatter: (r: AdminOrder) => `¥${r.amount}`
    },
    {
      prop: 'paymentStatus',
      label: '状态',
      width: 100,
      formatter: (r: AdminOrder) =>
        h(ElTag, { size: 'small', type: statusTagType(r.paymentStatus) }, () =>
          payStatusLabel(r.paymentStatus)
        )
    },
    {
      prop: 'createdAt',
      label: '创建时间',
      width: 170,
      formatter: (r: AdminOrder) => r.createdAt
    },
    {
      prop: 'ops',
      label: '操作',
      width: 90,
      fixed: 'right',
      formatter: (r: AdminOrder) =>
        h(ElButton, { link: true, type: 'primary', onClick: () => openDetail(r) }, () => '详情')
    }
  ])

  const load = async () => {
    loading.value = true
    try {
      const res = await fetchOpsOrderList({
        current: pagination.current,
        size: pagination.size,
        paymentStatus: searchForm.paymentStatus === '' ? undefined : searchForm.paymentStatus
      })
      records.value = res.records as AdminOrder[]
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
    searchForm.paymentStatus = ''
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
  const openDetail = (row: AdminOrder) => {
    detail.value = row
    detailVisible.value = true
  }

  onMounted(load)
</script>
