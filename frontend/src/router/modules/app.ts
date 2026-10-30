import { AppRouteRecord } from '@/types/router'

/**
 * 前台全局菜单（产品文档 §3.3）
 * 工作台 / 个人中心复用原页面组件进行改造
 */
export const appRoutes: AppRouteRecord[] = [
  {
    name: 'AppConsole',
    path: '/console',
    component: '/dashboard/console',
    meta: {
      title: 'menus.app.console',
      icon: 'ri:dashboard-line',
      keepAlive: false,
      fixedTab: true
    }
  },
  {
    name: 'AppGenealogies',
    path: '/genealogies',
    component: '/app/genealogies',
    meta: {
      title: 'menus.app.genealogies',
      icon: 'ri:book-2-line',
      keepAlive: false
    }
  },
  {
    name: 'AppSubscription',
    path: '/subscription',
    component: '/app/subscription',
    meta: {
      title: 'menus.app.subscription',
      icon: 'ri:vip-crown-line',
      keepAlive: false,
      // 入口改到顶栏靠右（用户要求），侧边栏不再展示
      isHide: true
    }
  },
  {
    name: 'AppAccount',
    path: '/account',
    component: '/system/user-center',
    meta: {
      title: 'menus.app.account',
      icon: 'ri:user-3-line',
      keepAlive: false,
      // 入口改到头像下拉「个人中心」（用户要求），侧边栏不再展示
      isHide: true
    }
  }
]
