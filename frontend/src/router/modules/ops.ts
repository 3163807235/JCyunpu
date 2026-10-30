import { AppRouteRecord } from '@/types/router'

/**
 * 运营后台（产品文档 §2 后台最小集 · 模块 N）
 * 角色：R_ADMIN / R_SUPER
 */
export const opsRoutes: AppRouteRecord = {
  path: '/ops',
  name: 'Ops',
  component: '/index/index',
  meta: {
    title: 'menus.ops.title',
    icon: 'ri:shield-star-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'dashboard',
      name: 'OpsDashboard',
      component: '/ops/dashboard',
      meta: {
        title: 'menus.ops.dashboard',
        icon: 'ri:dashboard-2-line',
        keepAlive: false,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'users',
      name: 'OpsUsers',
      component: '/ops/users',
      meta: {
        title: 'menus.ops.users',
        icon: 'ri:user-settings-line',
        keepAlive: false,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'orders',
      name: 'OpsOrders',
      component: '/ops/orders',
      meta: {
        title: 'menus.ops.orders',
        icon: 'ri:bill-line',
        keepAlive: false,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'audit',
      name: 'OpsAudit',
      component: '/ops/audit',
      meta: {
        title: 'menus.ops.audit',
        icon: 'ri:file-list-3-line',
        keepAlive: false,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
