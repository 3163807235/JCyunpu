<!-- 我的订单 · v3.1.6 §3.4 页面 13 Tab4 -->
<template>
  <div class="py-2">
    <div class="flex flex-wrap gap-2 mb-4">
      <ElSelect v-model="paymentStatus" clearable placeholder="支付状态" class="!w-36">
        <ElOption :value="0" label="待支付" />
        <ElOption :value="1" label="已支付" />
        <ElOption :value="2" label="已取消" />
        <ElOption :value="3" label="已退款" />
        <ElOption :value="4" label="支付超时" />
      </ElSelect>
      <ElButton @click="reload">查询</ElButton>
    </div>

    <ElTable v-loading="loading" :data="list" stripe>
      <ElTableColumn prop="orderNo" label="订单号" min-width="160" />
      <ElTableColumn prop="productName" label="商品" min-width="140" />
      <ElTableColumn label="金额" width="90">
        <template #default="{ row }">¥{{ row.amount }}</template>
      </ElTableColumn>
      <ElTableColumn label="支付方式" width="100">
        <template #default="{ row }">
          {{
            row.paymentMethod === 'wechat'
              ? '微信'
              : row.paymentMethod === 'alipay'
                ? '支付宝'
                : '—'
          }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="90">
        <template #default="{ row }">
          <ElTag size="small" :type="statusTag(row.paymentStatus)">
            {{ statusLabel(row.paymentStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="下单时间" width="170" />
      <ElTableColumn prop="paidAt" label="支付时间" width="170" />
      <ElTableColumn label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" @click="showDetail(row)">详情</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-end mt-3">
      <ElPagination
        v-model:current-page="current"
        v-model:page-size="size"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="load"
      />
    </div>

    <ElDialog v-model="detailVisible" title="订单详情" width="480px" align-center>
      <template v-if="detail">
        <p class="text-sm mb-2">订单号：{{ detail.orderNo }}</p>
        <p class="text-sm mb-2">商品：{{ detail.productName }}</p>
        <p class="text-sm mb-2">金额：¥{{ detail.amount }}</p>
        <p class="text-sm mb-2">状态：{{ statusLabel(detail.paymentStatus) }}</p>
        <p v-if="detail.grantedQuota" class="text-sm text-g-600">
          授予额度：人物
          {{ detail.grantedQuota.person ?? 0 }} · 存储 {{ detail.grantedQuota.storageMb ?? 0 }}MB
        </p>
        <p class="mt-3 text-xs text-g-500">退款需客服审核（MVP Mock 未开放自助退款）。</p>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchSubscriptionOrders } from '@/api/subscription'

  defineOptions({ name: 'SubscriptionOrdersTab' })

  const loading = ref(false)
  const list = ref<Api.Subscription.OrderItem[]>([])
  const current = ref(1)
  const size = ref(10)
  const total = ref(0)
  const paymentStatus = ref<Api.Subscription.PaymentStatus | undefined>()
  const detailVisible = ref(false)
  const detail = ref<Api.Subscription.OrderItem | null>(null)

  const statusLabel = (s: Api.Subscription.PaymentStatus) => {
    const map: Record<Api.Subscription.PaymentStatus, string> = {
      0: '待支付',
      1: '已支付',
      2: '已取消',
      3: '已退款',
      4: '支付超时'
    }
    return map[s]
  }
  const statusTag = (s: Api.Subscription.PaymentStatus) => {
    if (s === 1) return 'success'
    if (s === 0) return 'warning'
    if (s === 3) return 'info'
    return 'danger'
  }

  const load = async () => {
    loading.value = true
    try {
      const res = await fetchSubscriptionOrders({
        current: current.value,
        size: size.value,
        paymentStatus: paymentStatus.value
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

  const showDetail = (row: Api.Subscription.OrderItem) => {
    detail.value = row
    detailVisible.value = true
  }

  onMounted(load)
  defineExpose({ reload: load })
</script>
