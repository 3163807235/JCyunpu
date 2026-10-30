import request from '@/utils/http'
import {
  isMockEnabled,
  mockGetUserInfo,
  mockLogin,
  mockRegister,
  mockResetPassword,
  mockSendSmsCode
} from '@/mock/auth'

/**
 * 发送短信验证码
 */
export function fetchSendSmsCode(params: Api.Auth.SendSmsParams) {
  if (isMockEnabled()) {
    return mockSendSmsCode(params.phone)
  }
  return request.post<void>({
    url: '/api/auth/sms/send',
    params
  })
}

/**
 * 登录（支持密码 / 验证码）
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  if (isMockEnabled()) {
    return mockLogin(params)
  }
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/login',
    params
  })
}

/**
 * 注册
 */
export function fetchRegister(params: Api.Auth.RegisterParams) {
  if (isMockEnabled()) {
    return mockRegister(params)
  }
  return request.post<void>({
    url: '/api/auth/register',
    params
  })
}

/**
 * 重置密码
 */
export function fetchResetPassword(params: Api.Auth.ResetPasswordParams) {
  if (isMockEnabled()) {
    return mockResetPassword(params)
  }
  return request.post<void>({
    url: '/api/auth/password/reset',
    params
  })
}

/**
 * 获取用户信息
 */
export function fetchGetUserInfo() {
  if (isMockEnabled()) {
    return mockGetUserInfo()
  }
  return request.get<Api.Auth.UserInfo>({
    url: '/api/user/info'
  })
}
