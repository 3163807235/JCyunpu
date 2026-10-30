import { AppRouteRecord } from '@/types/router'
import { appRoutes } from './app'
import { opsRoutes } from './ops'
import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'

/**
 * 前台菜单置顶；运营后台（模块 N）供 R_ADMIN；模板系统管理保留给 R_SUPER
 */
export const routeModules: AppRouteRecord[] = [
  ...appRoutes,
  opsRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes
]
