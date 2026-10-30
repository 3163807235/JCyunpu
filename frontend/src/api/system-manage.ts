import request from '@/utils/http'
import { isMockEnabled } from '@/mock/auth'
import { mockGetRoleList, mockGetUserList } from '@/mock/system-manage'
import { AppRouteRecord } from '@/types/router'

/** 获取用户列表（Mock 登录下走本地，避免打 Apifox 401） */
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  if (isMockEnabled()) return mockGetUserList(params)
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

/** 获取角色列表 */
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  if (isMockEnabled()) return mockGetRoleList(params)
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

/** 获取菜单列表（后端权限模式用；前端模式一般不走此接口） */
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus/simple'
  })
}
