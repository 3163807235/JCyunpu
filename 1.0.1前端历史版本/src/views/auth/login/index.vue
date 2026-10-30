<!-- 登录页面：验证码 / 密码 / 第三方 三 Tab -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>

          <ElTabs v-model="loginTab" class="mt-5 login-tabs">
            <ElTabPane :label="$t('login.tabs.sms')" name="sms" />
            <ElTabPane :label="$t('login.tabs.password')" name="password" />
            <ElTabPane :label="$t('login.tabs.social')" name="social" />
          </ElTabs>

          <ElForm
            v-if="loginTab !== 'social'"
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="`${formKey}-${loginTab}`"
            label-position="top"
            @keyup.enter="handleSubmit"
          >
            <template v-if="loginTab === 'sms'">
              <ElFormItem prop="phone">
                <template #label>
                  <span class="form-field-title">{{ $t('login.field.phone') }}</span>
                </template>
                <ElInput
                  class="custom-height"
                  :placeholder="$t('login.placeholder.phone')"
                  v-model.trim="formData.phone"
                  maxlength="11"
                />
              </ElFormItem>
              <ElFormItem prop="smsCode">
                <template #label>
                  <span class="form-field-title">{{ $t('login.field.smsCode') }}</span>
                </template>
                <div class="flex gap-2 w-full">
                  <ElInput
                    class="custom-height flex-1"
                    :placeholder="$t('login.placeholder.smsCode')"
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
                      countdown > 0
                        ? $t('login.resendCode', { n: countdown })
                        : $t('login.sendCode')
                    }}
                  </ElButton>
                </div>
                <p v-if="isMock" class="mt-1 text-xs text-g-400">{{ $t('login.mockCodeHint') }}</p>
              </ElFormItem>
            </template>

            <template v-else>
              <ElFormItem prop="username">
                <template #label>
                  <span class="form-field-title">{{ $t('login.field.username') }}</span>
                </template>
                <ElInput
                  class="custom-height"
                  :placeholder="$t('login.placeholder.username')"
                  v-model.trim="formData.username"
                />
              </ElFormItem>
              <ElFormItem prop="password">
                <template #label>
                  <span class="form-field-title">{{ $t('login.field.password') }}</span>
                </template>
                <ElInput
                  class="custom-height"
                  :placeholder="$t('login.placeholder.password')"
                  v-model.trim="formData.password"
                  type="password"
                  autocomplete="off"
                  show-password
                />
              </ElFormItem>
            </template>

            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :text="$t('login.sliderText')"
                  textColor="var(--art-gray-700)"
                  :successText="$t('login.sliderSuccessText')"
                  progressBarBg="var(--main-color)"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                {{ $t('login.placeholder.slider') }}
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-if="loginTab === 'password'" v-model="formData.rememberPassword">
                {{ $t('login.rememberPwd') }}
              </ElCheckbox>
              <span v-else />
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">
                {{ $t('login.forgetPwd') }}
              </RouterLink>
            </div>

            <div class="mt-7.5">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600">
              <span>{{ $t('login.noAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Register' }">
                {{ $t('login.register') }}
              </RouterLink>
            </div>
          </ElForm>

          <div v-else class="social-login-panel">
            <p class="social-login-panel__hint">{{ $t('login.social.hint') }}</p>
            <div class="social-login-methods">
              <button
                v-for="item in socialMethods"
                :key="item.key"
                type="button"
                class="social-login-btn"
                @click="handleSocialLogin(item.key)"
              >
                <span class="social-login-icon" :class="`is-${item.key}`">
                  <ArtSvgIcon :icon="item.icon" class="text-xl" />
                </span>
                <span>{{ item.label }}</span>
              </button>
            </div>
            <div class="mt-5 text-sm text-gray-600">
              <span>{{ $t('login.noAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Register' }">
                {{ $t('login.register') }}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { HOME_PAGE_PATH } from '@/router'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin, fetchSendSmsCode } from '@/api/auth'
  import { validatePhone } from '@/utils/form/validator'
  import { ElMessage, ElNotification, type FormInstance, type FormRules } from 'element-plus'
  import { useSettingStore } from '@/store/modules/setting'
  import { isMockEnabled } from '@/mock/auth'

  defineOptions({ name: 'Login' })

  type SocialLoginKey = 'wechat' | 'qq'
  type LoginTab = 'sms' | 'password' | 'social'

  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)
  const { t, locale } = useI18n()
  const formKey = ref(0)
  const loginTab = ref<LoginTab>('sms')
  const isMock = isMockEnabled()

  watch(locale, () => {
    formKey.value++
  })

  const dragVerify = ref()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const isPassing = ref(false)
  const isClickPass = ref(false)
  const loading = ref(false)
  const smsSending = ref(false)
  const countdown = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const formData = reactive({
    phone: '',
    smsCode: '',
    username: '',
    password: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => {
    if (loginTab.value === 'sms') {
      return {
        phone: [
          { required: true, message: t('login.placeholder.phone'), trigger: 'blur' },
          {
            validator: (_r, value, cb) => {
              if (!validatePhone(value)) cb(new Error(t('register.rule.phoneInvalid')))
              else cb()
            },
            trigger: 'blur'
          }
        ],
        smsCode: [{ required: true, message: t('login.placeholder.smsCode'), trigger: 'blur' }]
      }
    }
    if (loginTab.value === 'password') {
      return {
        username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
        password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }]
      }
    }
    return {}
  })

  watch(loginTab, () => {
    isPassing.value = false
    isClickPass.value = false
    nextTick(() => resetDragVerify())
  })

  const socialMethods = computed(() => [
    { key: 'wechat' as const, label: t('login.social.wechat'), icon: 'ri:wechat-fill' },
    { key: 'qq' as const, label: t('login.social.qq'), icon: 'ri:qq-fill' }
  ])

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
      await fetchSendSmsCode({ phone: formData.phone, scene: 'login' })
      ElMessage.success(isMock ? t('login.mockCodeHint') : '验证码已发送')
      startCountdown()
    } catch (error: any) {
      ElMessage.error(error?.message || '发送失败')
    } finally {
      smsSending.value = false
    }
  }

  const handleSocialLogin = (key: SocialLoginKey) => {
    ElMessage.info(t('login.social.comingSoon', { method: t(`login.social.${key}`) }))
  }

  const handleSubmit = async () => {
    if (loginTab.value === 'social' || !formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      if (!isPassing.value) {
        isClickPass.value = true
        return
      }

      loading.value = true

      const payload: Api.Auth.LoginParams =
        loginTab.value === 'sms'
          ? {
              loginType: 'sms',
              phone: formData.phone,
              smsCode: formData.smsCode
            }
          : {
              loginType: 'password',
              userName: formData.username,
              password: formData.password
            }

      const { token, refreshToken } = await fetchLogin(payload)

      if (!token) {
        throw new Error('Login failed - no token received')
      }

      userStore.setToken(token, refreshToken)
      userStore.setLoginStatus(true)
      showLoginSuccessNotice()

      const redirect = route.query.redirect as string
      router.push(redirect || HOME_PAGE_PATH)
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('[Login] Unexpected error:', error)
        ElMessage.error((error as Error)?.message || '登录失败')
      }
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }

  const resetDragVerify = () => {
    dragVerify.value?.reset?.()
  }

  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 400)
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
</script>

<style scoped>
  @import './style.css';

  .login-tabs :deep(.el-tabs__header) {
    margin-bottom: 8px;
  }
</style>
