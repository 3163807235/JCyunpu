/**
 * 订阅与额度守卫（前端拦截层）
 * 依据：v3.1.6 §0.8 额度用尽 / 订阅过期；§0.4 高阶功能拦截
 * 成员专题：族谱成员（membership=member）强制只读，不占协作席位
 */
import { fetchSubscriptionSummary } from '@/api/subscription'
import { useGenealogyStore } from '@/store/modules/genealogy'

export function useSubscriptionGuard() {
  const genealogyStore = useGenealogyStore()
  const summary = ref<Api.Subscription.Summary | null>(null)
  const loading = ref(false)

  const status = computed(() => summary.value?.status || 'trial')
  const expired = computed(() => status.value === 'expired')
  const memberReadOnly = computed(() => genealogyStore.isMemberReadOnly)
  const quotaExhausted = computed(() => {
    if (!summary.value) return false
    return summary.value.personUsed >= summary.value.personLimit
  })
  /** 额度用尽：禁增可改；成员谱不可创建 */
  const canCreate = computed(() => !expired.value && !quotaExhausted.value && !memberReadOnly.value)
  /** 过期或族谱成员：全只读 */
  const canWrite = computed(() => !expired.value && !memberReadOnly.value)
  const canEdit = computed(() => !expired.value && !memberReadOnly.value)
  /** 定稿/PDF：过期、额度用尽、试用无印刷导出权；成员不可 */
  const canExportPdf = computed(() => {
    if (memberReadOnly.value) return false
    if (!summary.value || expired.value || quotaExhausted.value) return false
    return summary.value.allowPdfExport
  })

  const refresh = async () => {
    loading.value = true
    try {
      summary.value = await fetchSubscriptionSummary()
    } finally {
      loading.value = false
    }
  }

  return {
    summary,
    loading,
    status,
    expired,
    memberReadOnly,
    quotaExhausted,
    canCreate,
    canWrite,
    canEdit,
    canExportPdf,
    refresh
  }
}
