<!-- 额度流水 · v3.1.6 §3.4 页面 13 Tab3 -->
<template>
  <div class="py-2">
    <div class="flex flex-wrap gap-2 mb-4">
      <ElSelect v-model="quotaType" clearable placeholder="额度类型" class="!w-36">
        <ElOption value="person" label="人物额度" />
        <ElOption value="storage" label="存储额度" />
      </ElSelect>
      <ElSelect v-model="changeType" clearable placeholder="变动类型" class="!w-40">
        <ElOption value="gift" label="赠送" />
        <ElOption value="purchase" label="购买" />
        <ElOption value="expand" label="扩容" />
        <ElOption value="consume" label="消耗" />
        <ElOption value="manual_purge" label="彻底删除返还" />
        <ElOption value="auto_purge" label="期满自动返还" />
        <ElOption value="manual" label="人工调整" />
      </ElSelect>
      <ElButton @click="reload">查询</ElButton>
    </div>

    <ElTable v-loading="loading" :data="list" stripe>
      <ElTableColumn prop="createdAt" label="时间" width="170" />
      <ElTableColumn label="额度类型" width="100">
        <template #default="{ row }">
          {{ row.quotaType === 'person' ? '人物' : '存储' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="变动类型" width="120">
        <template #default="{ row }">{{ changeLabel(row.changeType) }}</template>
      </ElTableColumn>
      <ElTableColumn label="变动" width="100">
        <template #default="{ row }">
          <span :class="row.changeAmount >= 0 ? 'text-success' : 'text-danger'">
            {{ row.changeAmount >= 0 ? '+' : '' }}{{ row.changeAmount }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="balanceAfter" label="剩余额度" width="100" />
      <ElTableColumn prop="operatorName" label="操作人" width="100" />
      <ElTableColumn prop="remark" label="备注" min-width="180" show-overflow-tooltip />
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
    <p class="mt-2 text-xs text-g-500">流水永久留存、不可删除（文档 §1.7.13）。</p>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchQuotaTransactions } from '@/api/subscription'

  defineOptions({ name: 'SubscriptionQuotaTab' })

  const loading = ref(false)
  const list = ref<Api.Subscription.QuotaTransactionItem[]>([])
  const current = ref(1)
  const size = ref(10)
  const total = ref(0)
  const quotaType = ref<Api.Subscription.QuotaType | undefined>()
  const changeType = ref<Api.Subscription.ChangeType | undefined>()

  const changeLabel = (t: Api.Subscription.ChangeType) => {
    const map: Record<Api.Subscription.ChangeType, string> = {
      gift: '赠送',
      purchase: '购买',
      expand: '扩容',
      consume: '消耗',
      auto_purge: '期满返还',
      manual_purge: '彻底删除返还',
      manual: '人工调整'
    }
    return map[t] || t
  }

  const load = async () => {
    loading.value = true
    try {
      const res = await fetchQuotaTransactions({
        current: current.value,
        size: size.value,
        quotaType: quotaType.value,
        changeType: changeType.value
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

  onMounted(load)
  defineExpose({ reload: load })
</script>
