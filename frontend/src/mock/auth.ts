/**
 * 本地 Mock 鉴权数据（无自有后端时使用）
 * 固定验证码：123456
 */

export const MOCK_SMS_CODE = '123456'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export function isMockEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

/**
 * 鉴权是否走 Mock。
 * - `VITE_USE_AUTH_MOCK=false`：强制打真实后端（即便业务 Mock 仍开着）
 * - `VITE_USE_AUTH_MOCK=true`：强制鉴权 Mock
 * - 未配置：跟随 `VITE_USE_MOCK`
 */
export function isAuthMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_AUTH_MOCK
  if (v === 'false') return false
  if (v === 'true') return true
  return isMockEnabled()
}

/**
 * 族谱域 Mock。
 * - `VITE_USE_GENEALOGY_MOCK=false`：打真实后端
 * - 未配置：跟随 `VITE_USE_MOCK`
 */
export function isGenealogyMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_GENEALOGY_MOCK
  if (v === 'false') return false
  if (v === 'true') return true
  return isMockEnabled()
}

/**
 * 成员/邀请码域 Mock。
 * - `VITE_USE_MEMBER_MOCK=false`：打真实后端
 * - 未配置：跟随 `VITE_USE_MOCK`
 */
export function isMemberMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_MEMBER_MOCK
  if (v === 'false') return false
  if (v === 'true') return true
  return isMockEnabled()
}

export function isPersonMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_PERSON_MOCK
  if (v === 'false') return false
  if (v === 'true') return true
  return isMockEnabled()
}

export function isRelationshipMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_RELATIONSHIP_MOCK
  if (v === 'false') return false
  if (v === 'true') return true
  return isMockEnabled()
}

export function isSubscriptionMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_SUBSCRIPTION_MOCK
  if (v === 'false') return false
  if (v === 'true') return true
  return isMockEnabled()
}

export function isCollaboratorMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_COLLABORATOR_MOCK
  if (v === 'false') return false
  if (v === 'true') return true
  return isMockEnabled()
}

export async function mockSendSmsCode(phone: string): Promise<void> {
  await delay()
  if (!phone) {
    throw new Error('手机号不能为空')
  }
  if (import.meta.env.DEV) {
    console.info(`[Mock] 验证码已发送至 ${phone}，开发环境固定码：${MOCK_SMS_CODE}`)
  }
}

export async function mockLogin(params: Api.Auth.LoginParams): Promise<Api.Auth.LoginResponse> {
  await delay()

  if (params.loginType === 'sms') {
    if (!params.phone || !params.smsCode) {
      throw new Error('请输入手机号和验证码')
    }
    if (params.smsCode !== MOCK_SMS_CODE) {
      throw new Error('验证码错误（Mock 固定为 123456）')
    }
  } else {
    const account = params.userName || params.phone
    if (!account || !params.password) {
      throw new Error('请输入账号和密码')
    }
  }

  return {
    token: `mock-token-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`
  }
}

export async function mockGetUserInfo(): Promise<Api.Auth.UserInfo> {
  await delay()
  return {
    buttons: [],
    /** Mock：同时具备前台用户与运营后台角色，便于验收模块 N */
    roles: ['R_USER', 'R_ADMIN'],
    userId: 10001,
    userName: '修谱用户',
    email: '',
    phone: '13800138000',
    avatar: '',
    nickName: '云谱体验用户'
  }
}

export async function mockRegister(params: Api.Auth.RegisterParams): Promise<void> {
  await delay()
  if (!params.phone || !params.smsCode || !params.password) {
    throw new Error('请完善注册信息')
  }
  if (params.smsCode !== MOCK_SMS_CODE) {
    throw new Error('验证码错误（Mock 固定为 123456）')
  }
  // 有邀请码则校验并加入族谱成员（失败则整单失败）· 成员专题 §7.1
  const { mockJoinOnRegister } = await import('./member')
  mockJoinOnRegister(params.inviteCode)
}

export async function mockResetPassword(params: Api.Auth.ResetPasswordParams): Promise<void> {
  await delay()
  if (!params.phone || !params.smsCode || !params.password) {
    throw new Error('请完善重置信息')
  }
  if (params.smsCode !== MOCK_SMS_CODE) {
    throw new Error('验证码错误（Mock 固定为 123456）')
  }
}
