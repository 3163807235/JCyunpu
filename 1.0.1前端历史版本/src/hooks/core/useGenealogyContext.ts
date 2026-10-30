/**
 * 深链进入 /g/:id/* 时确保族谱上下文与侧栏已切换
 */
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchGenealogyDetail } from '@/api/genealogy'
import { useGenealogyStore } from '@/store/modules/genealogy'

export function useGenealogyContext() {
  const route = useRoute()
  const router = useRouter()
  const genealogyStore = useGenealogyStore()

  const ensure = async () => {
    const id = Number(route.params.id)
    if (!id) return

    if (genealogyStore.currentGenealogyId === id) {
      genealogyStore.applyStageMenus()
      return
    }

    try {
      const item = await fetchGenealogyDetail(id)
      await genealogyStore.enterGenealogy(item, false)
    } catch (e: any) {
      ElMessage.error(e?.message || '族谱不存在')
      router.push('/genealogies')
    }
  }

  watch(
    () => route.params.id,
    () => {
      ensure()
    },
    { immediate: true }
  )

  return { ensure }
}
