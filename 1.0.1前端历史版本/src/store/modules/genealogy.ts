/**
 * 族谱上下文 Store（Sprint 2）
 * 进入/退出族谱时切换侧栏菜单与 homePath
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppRouteRecord } from '@/types/router'
import { HOME_PAGE_PATH, router } from '@/router'
import { buildGenealogyMenuList } from '@/router/modules/genealogy'
import { useMenuStore } from '@/store/modules/menu'
import { fetchGenealogyDetail, fetchUpdateGenealogyStage } from '@/api/genealogy'
import { migrateLegacyStage, stageToRouteKey } from '@/utils/genealogy/stage'

const SESSION_KEY = 'jcyunpu_current_genealogy'

export interface CurrentGenealogy {
  id: number
  name: string
  mode: Api.Genealogy.Mode
  currentStage: Api.Genealogy.Stage
  layoutDirty?: 0 | 1
  /** 本族姓氏 */
  surname?: string
  hallName?: string
  ancestor?: string
  privacy: Api.Genealogy.Privacy
  personCount: number
  attachmentCount: number
  projectCount: number
  /** 当前用户身份：成员只读 · 专题 v0.1 */
  membership?: Api.Genealogy.Membership
}

function loadSession(): CurrentGenealogy | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CurrentGenealogy & { currentStage: number }
    if (typeof data.currentStage === 'number' && data.currentStage > 5) {
      data.currentStage = migrateLegacyStage(data.currentStage)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    }
    return data
  } catch {
    return null
  }
}

function saveSession(value: CurrentGenealogy | null) {
  if (!value) {
    sessionStorage.removeItem(SESSION_KEY)
    return
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(value))
}

function toCurrent(item: Api.Genealogy.Item): CurrentGenealogy {
  return {
    id: item.id,
    name: item.name,
    mode: item.mode,
    currentStage: item.currentStage,
    layoutDirty: item.layoutDirty ?? 0,
    surname: item.surname,
    hallName: item.hallName,
    ancestor: item.ancestor,
    privacy: item.privacy,
    personCount: item.personCount,
    attachmentCount: item.attachmentCount,
    projectCount: item.projectCount,
    membership: item.membership
  }
}

export const useGenealogyStore = defineStore('genealogyStore', () => {
  const current = ref<CurrentGenealogy | null>(loadSession())
  const globalMenuCache = ref<AppRouteRecord[]>([])

  const hasCurrentGenealogy = computed(() => !!current.value?.id)
  const currentGenealogyName = computed(() => current.value?.name || '')
  const currentGenealogyId = computed(() => current.value?.id ?? null)
  const currentMode = computed(() => current.value?.mode ?? null)
  const currentStage = computed(() => current.value?.currentStage ?? 1)
  /** 族谱成员（只读归属），非协作 */
  const isMemberReadOnly = computed(() => current.value?.membership === 'member')

  const cacheGlobalMenus = (list: AppRouteRecord[]) => {
    globalMenuCache.value = list.map((item) => ({ ...item }))
  }

  const applyStageMenus = () => {
    if (!current.value) return
    const menuStore = useMenuStore()
    const menus = buildGenealogyMenuList(
      current.value.id,
      current.value.mode,
      current.value.currentStage
    )
    menuStore.setMenuList(menus, { homePath: `/g/${current.value.id}/overview` })
  }

  const enterGenealogy = async (item: Api.Genealogy.Item, navigate = true) => {
    const menuStore = useMenuStore()
    if (!globalMenuCache.value.length && menuStore.menuList.length) {
      const first = menuStore.menuList[0]?.path || ''
      if (!first.startsWith('/g/')) {
        cacheGlobalMenus(menuStore.menuList)
      }
    }

    current.value = toCurrent(item)
    saveSession(current.value)
    applyStageMenus()

    if (navigate) {
      await router.push(`/g/${item.id}/overview`)
    }
  }

  const exitGenealogy = (navigate = true) => {
    const menuStore = useMenuStore()
    current.value = null
    saveSession(null)

    if (globalMenuCache.value.length) {
      menuStore.setMenuList(globalMenuCache.value, { homePath: HOME_PAGE_PATH })
    } else {
      menuStore.setHomePath(HOME_PAGE_PATH)
    }

    if (navigate) {
      router.push('/genealogies')
    }
  }

  const refreshFromServer = async (id: number) => {
    const item = await fetchGenealogyDetail(id)
    current.value = toCurrent(item)
    saveSession(current.value)
    applyStageMenus()
    return current.value
  }

  const setStage = async (stage: Api.Genealogy.Stage, navigate = false) => {
    if (!current.value) return
    const item = await fetchUpdateGenealogyStage(current.value.id, stage)
    current.value = toCurrent(item)
    saveSession(current.value)
    applyStageMenus()

    if (navigate) {
      const key = stageToRouteKey(current.value.mode, stage)
      await router.push(`/g/${current.value.id}/${key}`)
    }
  }

  /** 刷新后若 session 有族谱，恢复侧栏 */
  const restoreMenusIfNeeded = () => {
    if (current.value) {
      applyStageMenus()
    }
  }

  return {
    current,
    globalMenuCache,
    hasCurrentGenealogy,
    currentGenealogyName,
    currentGenealogyId,
    currentMode,
    currentStage,
    isMemberReadOnly,
    cacheGlobalMenus,
    enterGenealogy,
    exitGenealogy,
    refreshFromServer,
    setStage,
    applyStageMenus,
    restoreMenusIfNeeded
  }
})
