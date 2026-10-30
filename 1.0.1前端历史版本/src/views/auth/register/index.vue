<!-- 注册：手机号 + 验证码 + 密码强度 + 协议 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('register.title') }}</h3>
          <p class="sub-title">{{ $t('register.subTitle') }}</p>
          <ElForm
            class="mt-7.5"
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            :key="formKey"
          >
            <ElFormItem prop="phone">
              <ElInput
                class="custom-height"
                v-model.trim="formData.phone"
                :placeholder="$t('register.placeholder.phone')"
                maxlength="11"
              />
            </ElFormItem>

            <ElFormItem prop="smsCode">
              <div class="flex gap-2 w-full">
                <ElInput
                  class="custom-height flex-1"
                  v-model.trim="formData.smsCode"
                  :placeholder="$t('register.placeholder.smsCode')"
                  maxlength="6"
                />
                <ElButton
                  class="!h-10 shrink-0"
                  :disabled="countdown > 0 || smsSending"
                  :loading="smsSending"
                  @click="sendCode"
                >
                  {{
                    countdown > 0 ? $t('login.resendCode', { n: countdown }) : $t('login.sendCode')
                  }}
                </ElButton>
              </div>
              <p v-if="isMock" class="mt-1 text-xs text-g-400">{{ $t('login.mockCodeHint') }}</p>
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                v-model.trim="formData.password"
                :placeholder="$t('register.placeholder.password')"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.confirmPassword"
                :placeholder="$t('register.placeholder.confirmPassword')"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="inviteCode">
              <ElInput
                class="custom-height"
                v-model.trim="formData.inviteCode"
                :placeholder="$t('register.placeholder.inviteCode')"
                maxlength="16"
                @keyup.enter="register"
              />
              <p class="mt-1 text-xs text-g-400">{{ $t('register.inviteCodeHint') }}</p>
            </ElFormItem>

            <ElFormItem prop="agreement">
              <ElCheckbox v-model="formData.agreement">
                {{ $t('register.agreeText') }}
                <a class="text-theme" href="#" @click.prevent>{{ $t('register.userAgreement') }}</a>
                <a class="text-theme" href="#" @click.prevent>{{ $t('register.privacyPolicy') }}</a>
              </ElCheckbox>
            </ElFormItem>

            <div class="mt-4">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="register"
                :loading="loading"
                v-ripple
              >
                {{ $t('register.submitBtnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-g-600">
              <span>{{ $t('register.hasAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Login' }">
                {{ $t('register.toLogin') }}
              </RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { fetchRegister, fetchSendSmsCode } from '@/api/auth'
  import { validatePhone } from '@/utils/form/validator'
  import { isValidInviteCodeFormat } from '@/utils/genealogy/invite-code'
  import { isMockEnabled } from '@/mock/auth'

  defineOptions({ name: 'Register' })

  interface RegisterForm {
    phone: string
    smsCode: string
    password: string
    confirmPassword: string
    inviteCode: string
    agreement: boolean
  }

  const REDIRECT_DELAY = 800
  const { t, locale } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const formKey = ref(0)
  const smsSending = ref(false)
  const countdown = ref(0)
  const isMock = isMockEnabled()
  let timer: ReturnType<typeof setInterval> | null = null

  watch(locale, () => {
    formKey.value++
  })

  const formData = reactive<RegisterForm>({
    phone: '',
    smsCode: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
    agreement: false
  })

  onMounted(() => {
    const code = String(route.query.code || '').trim()
    if (code) formData.inviteCode = code.toUpperCase()
  })

  /** 产品文档：不少于 8 位，字母+数字 */
  const isProductPassword = (value: string) => {
    const v = value.trim()
    return v.length >= 8 && v.length <= 20 && /[a-zA-Z]/.test(v) && /\d/.test(v)
  }

  const validatePassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.placeholder.password')))
      return
    }
    if (!isProductPassword(value)) {
      callback(new Error(t('register.rule.passwordLength')))
      return
    }
    if (formData.confirmPassword) {
      formRef.value?.validateField('confirmPassword')
    }
    callback()
  }

  const validateConfirmPassword = (
    _rule: any,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error(t('register.rule.confirmPasswordRequired')))
      return
    }
    if (value !== formData.password) {
      callback(new Error(t('register.rule.passwordMismatch')))
      return
    }
    callback()
  }

  const validateAgreement = (_rule: any, value: boolean, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule.agreementRequired')))
      return
    }
    callback()
  }

  const validateInviteCode = (_rule: any, value: string, callback: (error?: Error) => void) => {
    const v = (value || '').trim()
    if (!v) {
      callback()
      return
    }
    if (!isValidInviteCodeFormat(v)) {
      callback(new Error(t('register.rule.inviteCodeInvalid')))
      return
    }
    callback()
  }

  const rules = computed<FormRules<RegisterForm>>(() => ({
    phone: [
      { required: true, message: t('register.placeholder.phone'), trigger: 'blur' },
      {
        validator: (_r, value, cb) => {
          if (!validatePhone(value)) cb(new Error(t('register.rule.phoneInvalid')))
          else cb()
        },
        trigger: 'blur'
      }
    ],
    smsCode: [{ required: true, message: t('register.placeholder.smsCode'), trigger: 'blur' }],
    password: [{ required: true, validator: validatePassword, trigger: 'blur' }],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
    inviteCode: [{ validator: validateInviteCode, trigger: 'blur' }],
    agreement: [{ validator: validateAgreement, trigger: 'change' }]
  }))

  const startCountdown = () => {
    countdown.value = 60
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }

  const sendCode = async () => {
    if (!validatePhone(formData.phone)) {
      ElMessage.warning(t('register.rule.phoneInvalid'))
      return
    }
    try {
      smsSending.value = true
      await fetchSendSmsCode({ phone: formData.phone, scene: 'register' })
      ElMessage.success(isMock ? t('login.mockCodeHint') : '验证码已发送')
      startCountdown()
    } catch (error: any) {
      ElMessage.error(error?.message || '发送失败')
    } finally {
      smsSending.value = false
    }
  }

  const register = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true
      await fetchRegister({
        phone: formData.phone,
        smsCode: formData.smsCode,
        password: formData.password,
        inviteCode: formData.inviteCode.trim() || undefined
      })
      ElMessage.success(
        formData.inviteCode.trim() ? t('register.successWithInvite') : t('register.success')
      )
      toLogin()
    } catch (error: any) {
      if (error?.message) ElMessage.error(error.message)
      console.error('注册失败:', error)
    } finally {
      loading.value = false
    }
  }

  const toLogin = () => {
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, REDIRECT_DELAY)
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
</script>

<style scoped>
  @import '../login/style.css';
</style>
