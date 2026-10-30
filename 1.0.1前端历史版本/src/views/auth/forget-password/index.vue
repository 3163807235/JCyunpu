<!-- 忘记密码：手机验证码重置 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('forgetPassword.title') }}</h3>
          <p class="sub-title">{{ $t('forgetPassword.subTitle') }}</p>

          <ElForm
            ref="formRef"
            class="mt-5"
            :model="formData"
            :rules="rules"
            label-position="top"
            @keyup.enter="submit"
          >
            <ElFormItem prop="phone">
              <ElInput
                class="custom-height"
                :placeholder="$t('forgetPassword.placeholder')"
                v-model.trim="formData.phone"
                maxlength="11"
              />
            </ElFormItem>

            <ElFormItem prop="smsCode">
              <div class="flex gap-2 w-full">
                <ElInput
                  class="custom-height flex-1"
                  :placeholder="$t('forgetPassword.placeholderCode')"
                  v-model.trim="formData.smsCode"
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
                :placeholder="$t('forgetPassword.placeholderPassword')"
                v-model.trim="formData.password"
                type="password"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                class="custom-height"
                :placeholder="$t('forgetPassword.placeholderConfirm')"
                v-model.trim="formData.confirmPassword"
                type="password"
                show-password
              />
            </ElFormItem>
          </ElForm>

          <div class="mt-4">
            <ElButton
              class="w-full custom-height"
              type="primary"
              @click="submit"
              :loading="loading"
              v-ripple
            >
              {{ $t('forgetPassword.submitBtnText') }}
            </ElButton>
          </div>

          <div class="mt-4">
            <ElButton class="w-full custom-height" plain @click="toLogin">
              {{ $t('forgetPassword.backBtnText') }}
            </ElButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { fetchResetPassword, fetchSendSmsCode } from '@/api/auth'
  import { validatePhone } from '@/utils/form/validator'
  import { isMockEnabled } from '@/mock/auth'

  defineOptions({ name: 'ForgetPassword' })

  const { t } = useI18n()
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const smsSending = ref(false)
  const countdown = ref(0)
  const isMock = isMockEnabled()
  let timer: ReturnType<typeof setInterval> | null = null

  const formData = reactive({
    phone: '',
    smsCode: '',
    password: '',
    confirmPassword: ''
  })

  const isProductPassword = (value: string) => {
    const v = value.trim()
    return v.length >= 8 && v.length <= 20 && /[a-zA-Z]/.test(v) && /\d/.test(v)
  }

  const rules = computed<FormRules>(() => ({
    phone: [
      { required: true, message: t('forgetPassword.placeholder'), trigger: 'blur' },
      {
        validator: (_r, value, cb) => {
          if (!validatePhone(value)) cb(new Error(t('register.rule.phoneInvalid')))
          else cb()
        },
        trigger: 'blur'
      }
    ],
    smsCode: [
      { required: true, message: t('forgetPassword.placeholderCode'), trigger: 'blur' }
    ],
    password: [
      {
        validator: (_r, value, cb) => {
          if (!value) cb(new Error(t('forgetPassword.placeholderPassword')))
          else if (!isProductPassword(value)) cb(new Error(t('register.rule.passwordLength')))
          else cb()
        },
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      {
        validator: (_r, value, cb) => {
          if (!value) cb(new Error(t('forgetPassword.placeholderConfirm')))
          else if (value !== formData.password) cb(new Error(t('register.rule.passwordMismatch')))
          else cb()
        },
        trigger: 'blur'
      }
    ]
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
      await fetchSendSmsCode({ phone: formData.phone, scene: 'reset' })
      ElMessage.success(isMock ? t('login.mockCodeHint') : '验证码已发送')
      startCountdown()
    } catch (error: any) {
      ElMessage.error(error?.message || '发送失败')
    } finally {
      smsSending.value = false
    }
  }

  const submit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      loading.value = true
      await fetchResetPassword({
        phone: formData.phone,
        smsCode: formData.smsCode,
        password: formData.password
      })
      ElMessage.success(t('forgetPassword.success'))
      toLogin()
    } catch (error: any) {
      if (error?.message) ElMessage.error(error.message)
    } finally {
      loading.value = false
    }
  }

  const toLogin = () => {
    router.push({ name: 'Login' })
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
</script>

<style scoped>
  @import '../login/style.css';
</style>
