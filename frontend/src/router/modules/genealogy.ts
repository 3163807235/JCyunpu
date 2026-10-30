/**
 * 单族谱空间路由 · v3.1.6 §3.3 双区
 * 日常区一级菜单含二级子菜单：信息管理 / 家族文化 / 权限管理
 */
import { AppRouteRecord } from '@/types/router'

export const genealogyRoutes: AppRouteRecord = {
  path: '/g',
  name: 'GenealogySpace',
  component: '/index/index',
  meta: {
    title: 'menus.genealogy.title',
    icon: 'ri:ancient-gate-line',
    isHide: true
  },
  children: [
    {
      path: ':id/overview',
      name: 'GenealogyOverview',
      component: '/genealogy/overview',
      meta: {
        title: 'menus.genealogy.overview',
        icon: 'ri:dashboard-2-line',
        keepAlive: false,
        zone: 'daily'
      }
    },
    // 信息管理 · 子菜单（引导：先字辈 → 人员 → 关系图谱）
    {
      path: ':id/info',
      name: 'GenealogyInfo',
      component: '/genealogy/info',
      meta: {
        title: 'menus.genealogy.info',
        icon: 'ri:group-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/info/generation',
      name: 'GenealogyInfoGeneration',
      component: '/genealogy/info/generation',
      meta: {
        title: 'menus.genealogy.infoGeneration',
        icon: 'ri:text-snippet',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/info/persons',
      name: 'GenealogyInfoPersons',
      component: '/genealogy/info/persons',
      meta: {
        title: 'menus.genealogy.infoPersons',
        icon: 'ri:user-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/info/relations',
      name: 'GenealogyInfoRelations',
      component: '/genealogy/info/relations',
      meta: {
        title: 'menus.genealogy.infoRelations',
        icon: 'ri:node-tree',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/collect',
      name: 'GenealogyCollect',
      component: '/genealogy/collect',
      meta: {
        title: 'menus.genealogy.info',
        icon: 'ri:group-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/project',
      name: 'GenealogyProject',
      component: '/genealogy/project',
      meta: {
        title: 'menus.genealogy.project',
        icon: 'ri:flag-line',
        keepAlive: false,
        stage: 1,
        zone: 'flow'
      }
    },
    {
      path: ':id/compose',
      name: 'GenealogyCompose',
      component: '/genealogy/compose',
      meta: {
        title: 'menus.genealogy.compose',
        icon: 'ri:file-edit-line',
        keepAlive: false,
        stage: 2,
        zone: 'flow'
      }
    },
    {
      path: ':id/review',
      name: 'GenealogyReview',
      component: '/genealogy/review',
      meta: {
        title: 'menus.genealogy.review',
        icon: 'ri:shield-check-line',
        keepAlive: false,
        stage: 3,
        zone: 'flow'
      }
    },
    {
      path: ':id/layout',
      name: 'GenealogyLayout',
      component: '/genealogy/layout',
      meta: {
        title: 'menus.genealogy.layout',
        icon: 'ri:layout-2-line',
        keepAlive: false,
        stage: 4,
        zone: 'flow'
      }
    },
    {
      path: ':id/archive',
      name: 'GenealogyArchive',
      component: '/genealogy/archive',
      meta: {
        title: 'menus.genealogy.archive',
        icon: 'ri:archive-line',
        keepAlive: false,
        stage: 5,
        zone: 'flow'
      }
    },
    // 家族文化 · 子菜单（§3.4 页面 11）
    {
      path: ':id/culture',
      name: 'GenealogyCulture',
      component: '/genealogy/culture',
      meta: {
        title: 'menus.genealogy.culture',
        icon: 'ri:ancient-pavilion-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/culture/rules',
      name: 'GenealogyCultureRules',
      component: '/genealogy/culture/rules',
      meta: {
        title: 'menus.genealogy.cultureRules',
        icon: 'ri:book-read-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/culture/events',
      name: 'GenealogyCultureEvents',
      component: '/genealogy/culture/events',
      meta: {
        title: 'menus.genealogy.cultureEvents',
        icon: 'ri:calendar-event-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/culture/origin',
      name: 'GenealogyCultureOrigin',
      component: '/genealogy/culture/origin',
      meta: {
        title: 'menus.genealogy.cultureOrigin',
        icon: 'ri:ancient-gate-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily',
        showTextBadge: 'V1.5'
      }
    },
    {
      path: ':id/culture/hall',
      name: 'GenealogyCultureHall',
      component: '/genealogy/culture/hall',
      meta: {
        title: 'menus.genealogy.cultureHall',
        icon: 'ri:home-smile-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily',
        showTextBadge: 'V1.5'
      }
    },
    {
      path: ':id/culture/album',
      name: 'GenealogyCultureAlbum',
      component: '/genealogy/culture/album',
      meta: {
        title: 'menus.genealogy.cultureAlbum',
        icon: 'ri:image-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily',
        showTextBadge: 'V1.5'
      }
    },
    // 权限管理 · 子菜单（§3.4 页面 12）
    {
      path: ':id/settings',
      name: 'GenealogySettings',
      component: '/genealogy/settings',
      meta: {
        title: 'menus.genealogy.settings',
        icon: 'ri:settings-3-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/settings/roles',
      name: 'GenealogySettingsRoles',
      component: '/genealogy/settings/roles',
      meta: {
        title: 'menus.genealogy.settingsRoles',
        icon: 'ri:user-settings-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/settings/branches',
      name: 'GenealogySettingsBranches',
      component: '/genealogy/settings/branches',
      meta: {
        title: 'menus.genealogy.settingsBranches',
        icon: 'ri:git-branch-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily',
        showTextBadge: 'V1.5'
      }
    },
    {
      path: ':id/settings/permissions',
      name: 'GenealogySettingsPermissions',
      component: '/genealogy/settings/permissions',
      meta: {
        title: 'menus.genealogy.settingsPermissions',
        icon: 'ri:shield-keyhole-line',
        keepAlive: false,
        isHide: true,
        zone: 'daily'
      }
    },
    {
      path: ':id/archives',
      name: 'GenealogyArchives',
      component: '/genealogy/archives',
      meta: {
        title: 'menus.genealogy.archives',
        icon: 'ri:folder-image-line',
        keepAlive: false,
        zone: 'cross'
      }
    }
  ]
}

export interface GenealogyMenuChildDef {
  key: string
  title: string
  icon: string
  /** V1.5 / P1 等角标；有角标仍展示入口，页面内说明未上线 */
  showTextBadge?: string
}

/** 侧栏菜单项定义（不含 :id，由 store 拼完整 path） */
export interface GenealogyMenuDef {
  key: string
  title: string
  icon: string
  /** 修谱流程区阶段；日常区 / 横切不设 */
  stage?: Api.Genealogy.Stage
  zone: 'daily' | 'flow' | 'cross'
  children?: GenealogyMenuChildDef[]
}

export const genealogyMenuDefs: GenealogyMenuDef[] = [
  { key: 'overview', title: 'menus.genealogy.overview', icon: 'ri:dashboard-2-line', zone: 'daily' },
  {
    key: 'info',
    title: 'menus.genealogy.info',
    icon: 'ri:group-line',
    zone: 'daily',
    children: [
      { key: 'generation', title: 'menus.genealogy.infoGeneration', icon: 'ri:text-snippet' },
      { key: 'persons', title: 'menus.genealogy.infoPersons', icon: 'ri:user-line' },
      { key: 'relations', title: 'menus.genealogy.infoRelations', icon: 'ri:node-tree' }
    ]
  },
  {
    key: 'culture',
    title: 'menus.genealogy.culture',
    icon: 'ri:ancient-pavilion-line',
    zone: 'daily',
    children: [
      { key: 'rules', title: 'menus.genealogy.cultureRules', icon: 'ri:book-read-line' },
      { key: 'events', title: 'menus.genealogy.cultureEvents', icon: 'ri:calendar-event-line' },
      {
        key: 'origin',
        title: 'menus.genealogy.cultureOrigin',
        icon: 'ri:ancient-gate-line',
        showTextBadge: 'V1.5'
      },
      {
        key: 'hall',
        title: 'menus.genealogy.cultureHall',
        icon: 'ri:home-smile-line',
        showTextBadge: 'V1.5'
      },
      {
        key: 'album',
        title: 'menus.genealogy.cultureAlbum',
        icon: 'ri:image-line',
        showTextBadge: 'V1.5'
      }
    ]
  },
  {
    key: 'settings',
    title: 'menus.genealogy.settings',
    icon: 'ri:settings-3-line',
    zone: 'daily',
    children: [
      { key: 'roles', title: 'menus.genealogy.settingsRoles', icon: 'ri:user-settings-line' },
      {
        key: 'branches',
        title: 'menus.genealogy.settingsBranches',
        icon: 'ri:git-branch-line',
        showTextBadge: 'V1.5'
      },
      {
        key: 'permissions',
        title: 'menus.genealogy.settingsPermissions',
        icon: 'ri:shield-keyhole-line'
      }
    ]
  },
  { key: 'project', title: 'menus.genealogy.project', icon: 'ri:flag-line', stage: 1, zone: 'flow' },
  { key: 'compose', title: 'menus.genealogy.compose', icon: 'ri:file-edit-line', stage: 2, zone: 'flow' },
  { key: 'review', title: 'menus.genealogy.review', icon: 'ri:shield-check-line', stage: 3, zone: 'flow' },
  { key: 'layout', title: 'menus.genealogy.layout', icon: 'ri:layout-2-line', stage: 4, zone: 'flow' },
  { key: 'archive', title: 'menus.genealogy.archive', icon: 'ri:archive-line', stage: 5, zone: 'flow' },
  {
    key: 'archives',
    title: 'menus.genealogy.archives',
    icon: 'ri:folder-image-line',
    zone: 'cross'
  }
]

/**
 * 按模式与已到达阶段过滤侧栏菜单（v3.1.6 §3.3 双区）
 * 日常区 / 横切始终可见；流程区 stage <= currentStage；简易模式隐藏校对(3)
 * 信息管理 / 家族文化 / 权限管理 为一级+二级子菜单
 */
export function buildGenealogyMenuList(
  genealogyId: number,
  mode: Api.Genealogy.Mode,
  currentStage: Api.Genealogy.Stage
): AppRouteRecord[] {
  const visible = genealogyMenuDefs.filter((def) => {
    if (def.zone === 'daily' || def.zone === 'cross') return true
    if (def.stage == null) return true
    if (mode === 'simple' && def.stage === 3) return false
    return def.stage <= currentStage
  })

  const result: AppRouteRecord[] = []

  for (const def of visible) {
    if (def.children?.length) {
      result.push({
        name: `GMenu_${def.key}_${genealogyId}`,
        path: `/g/${genealogyId}/${def.key}`,
        meta: {
          title: def.title,
          icon: def.icon,
          keepAlive: false,
          zone: def.zone
        },
        children: def.children.map((child) => ({
          name: `GMenu_${def.key}_${child.key}_${genealogyId}`,
          path: `/g/${genealogyId}/${def.key}/${child.key}`,
          component: `/genealogy/${def.key}/${child.key}`,
          meta: {
            title: child.title,
            icon: child.icon,
            keepAlive: false,
            zone: def.zone,
            ...(child.showTextBadge ? { showTextBadge: child.showTextBadge } : {})
          }
        }))
      })
      continue
    }

    result.push({
      name: `GMenu_${def.key}_${genealogyId}`,
      path: `/g/${genealogyId}/${def.key}`,
      component: `/genealogy/${def.key}`,
      meta: {
        title: def.title,
        icon: def.icon,
        keepAlive: false,
        zone: def.zone,
        ...(def.stage != null ? { stage: def.stage } : {})
      }
    })
  }

  return result
}
