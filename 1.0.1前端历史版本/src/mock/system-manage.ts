/**
 * 脚手架「系统管理」Mock：用户/角色列表
 * Mock 登录 token 不被 Apifox 认可，开 VITE_USE_MOCK 时走本地数据，避免 401。
 */

import { ACCOUNT_TABLE_DATA } from '@/mock/temp/formData'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function toUserItem(row: (typeof ACCOUNT_TABLE_DATA)[number]): Api.SystemManage.UserListItem {
  return {
    id: row.id,
    avatar: row.avatar,
    status: row.status,
    userName: row.username,
    userGender: row.gender === 1 ? '男' : '女',
    nickName: row.username,
    userPhone: row.mobile,
    userEmail: row.email,
    userRoles: ['R_USER'],
    createBy: 'system',
    createTime: row.create_time,
    updateBy: 'system',
    updateTime: row.create_time
  }
}

const ROLE_SEED: Api.SystemManage.RoleListItem[] = [
  {
    roleId: 1,
    roleName: '超级管理员',
    roleCode: 'R_SUPER',
    description: '全部权限',
    enabled: true,
    createTime: '2024-01-01 00:00:00'
  },
  {
    roleId: 2,
    roleName: '管理员',
    roleCode: 'R_ADMIN',
    description: '运营后台',
    enabled: true,
    createTime: '2024-01-01 00:00:00'
  },
  {
    roleId: 3,
    roleName: '修谱用户',
    roleCode: 'R_USER',
    description: '前台修谱',
    enabled: true,
    createTime: '2024-01-01 00:00:00'
  }
]

export async function mockGetUserList(
  params: Api.SystemManage.UserSearchParams
): Promise<Api.SystemManage.UserList> {
  await delay()
  let list = ACCOUNT_TABLE_DATA.map(toUserItem)

  if (params.userName?.trim()) {
    const kw = params.userName.trim().toLowerCase()
    list = list.filter((u) => u.userName.toLowerCase().includes(kw))
  }
  if (params.userPhone?.trim()) {
    list = list.filter((u) => u.userPhone.includes(params.userPhone!.trim()))
  }
  if (params.userEmail?.trim()) {
    const kw = params.userEmail.trim().toLowerCase()
    list = list.filter((u) => u.userEmail.toLowerCase().includes(kw))
  }
  if (params.userGender) {
    list = list.filter((u) => u.userGender === params.userGender)
  }
  if (params.status) {
    list = list.filter((u) => u.status === params.status)
  }
  if (params.id != null) {
    list = list.filter((u) => u.id === Number(params.id))
  }

  const current = Number(params.current) || 1
  const size = Number(params.size) || 20
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    current,
    size,
    total: list.length
  }
}

export async function mockGetRoleList(
  params: Api.SystemManage.RoleSearchParams
): Promise<Api.SystemManage.RoleList> {
  await delay()
  let list = [...ROLE_SEED]
  if (params.roleName?.trim()) {
    const kw = params.roleName.trim()
    list = list.filter((r) => r.roleName.includes(kw))
  }
  if (params.roleCode?.trim()) {
    const kw = params.roleCode.trim()
    list = list.filter((r) => r.roleCode.includes(kw))
  }
  if (params.enabled != null) {
    list = list.filter((r) => r.enabled === params.enabled)
  }

  const current = Number(params.current) || 1
  const size = Number(params.size) || 20
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    current,
    size,
    total: list.length
  }
}
