import { AppRouteRecord } from '@/types/router'

export const exceptionRoutes: AppRouteRecord = {
  path: '/exception',
  name: 'Exception',
  component: '/index/index',
  meta: {
    title: 'menus.exception.title',
    icon: 'ri:error-warning-line',
    /** 菜单对普通用户隐藏；路由仍可访问（403/404/500） */
    roles: ['R_SUPER']
  },
  children: [
    {
      path: '403',
      name: 'Exception403',
      component: '/exception/403',
      meta: {
        title: 'menus.exception.forbidden',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true
      }
    },
    {
      path: '404',
      name: 'Exception404',
      component: '/exception/404',
      meta: {
        title: 'menus.exception.notFound',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true
      }
    },
    {
      path: '500',
      name: 'Exception500',
      component: '/exception/500',
      meta: {
        title: 'menus.exception.serverError',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true
      }
    }
  ]
}
