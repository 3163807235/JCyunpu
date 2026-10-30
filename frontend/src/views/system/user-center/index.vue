<!-- 个人中心 · 产品文档 §3.4 前台页面 14：账号信息 / 修改密码。消息通知改由顶部栏「查看全部」居中弹窗 -->
<template>
  <div class="user-center-page w-full p-0 bg-transparent border-none shadow-none">
    <div class="user-center-row relative">
      <div class="user-center-profile">
        <div class="art-card-sm user-center-card relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="@imgs/user/bg.webp" />
          <img
            class="relative z-10 w-20 h-20 mt-30 mx-auto object-cover border-2 border-white rounded-full"
            :src="avatarSrc"
          />
          <h2 class="mt-5 text-xl font-normal">{{ displayName }}</h2>
          <p class="mt-5 text-sm text-g-600">账号 ID：{{ userInfo.userId || '—' }}</p>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:smartphone-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ form.mobile || '未绑定手机' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ form.email || '未绑定邮箱' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:vip-crown-line" class="text-g-700" />
              <span class="ml-2 text-sm">试用套餐 · 试用中</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:calendar-line" class="text-g-700" />
              <span class="ml-2 text-sm">注册时间：2026-08-01</span>
            </div>
          </div>

          <div class="mt-auto pt-10">
            <h3 class="text-sm font-medium">标签</h3>
            <div class="flex flex-wrap justify-center mt-3.5">
              <div
                v-for="item in labelList"
                :key="item"
                class="py-1 px-1.5 mr-2.5 mb-2.5 text-xs border border-g-300 rounded"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="user-center-forms">
        <div class="art-card-sm user-center-card user-center-main">
          <ElTabs v-model="activeTab" class="user-center-tabs">
            <ElTabPane label="账号信息" name="profile">
              <div
                class="mb-4 rounded-lg border border-dashed border-g-300 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div class="min-w-0">
                  <p class="text-sm font-medium">加入族谱</p>
                  <p class="text-xs text-g-500 mt-0.5">
                    输入族谱邀请码成为成员（只读），不占用协作席位
                  </p>
                </div>
                <ElButton type="primary" plain v-ripple @click="joinVisible = true">
                  <ArtSvgIcon icon="ri:qr-code-line" class="mr-1" />
                  输入邀请码
                </ElButton>
              </div>

              <div class="card-header shrink-0">
                <h1 class="text-xl font-normal">基本设置</h1>
                <ElButton type="primary" class="w-22.5" v-ripple @click="edit">
                  {{ isEdit ? '保存' : '编辑' }}
                </ElButton>
              </div>

              <ElForm
                :model="form"
                class="user-center-form box-border p-5 [&>.el-row_.el-form-item]:w-[calc(50%-10px)] [&>.el-row_.el-input]:w-full [&>.el-row_.el-select]:w-full"
                ref="ruleFormRef"
                :rules="rules"
                label-width="86px"
                label-position="top"
              >
                <ElRow>
                  <ElFormItem label="姓名" prop="realName">
                    <ElInput v-model="form.realName" :disabled="!isEdit" />
                  </ElFormItem>
                  <ElFormItem label="昵称" prop="nickName" class="ml-5">
                    <ElInput v-model="form.nickName" :disabled="!isEdit" />
                  </ElFormItem>
                </ElRow>

                <ElRow>
                  <ElFormItem label="手机" prop="mobile">
                    <ElInput v-model="form.mobile" disabled />
                  </ElFormItem>
                  <ElFormItem label="邮箱" prop="email" class="ml-5">
                    <ElInput v-model="form.email" :disabled="!isEdit" />
                  </ElFormItem>
                </ElRow>

                <ElRow>
                  <ElFormItem label="性别" prop="sex">
                    <ElSelect v-model="form.sex" placeholder="请选择" :disabled="!isEdit">
                      <ElOption
                        v-for="item in options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                  <ElFormItem label="地址" prop="address" class="ml-5">
                    <ElInput v-model="form.address" :disabled="!isEdit" />
                  </ElFormItem>
                </ElRow>

                <ElFormItem label="个人介绍" prop="des">
                  <ElInput type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
                </ElFormItem>
              </ElForm>
            </ElTabPane>

            <ElTabPane label="修改密码" name="password">
              <div class="card-header shrink-0">
                <h1 class="text-xl font-normal">更改密码</h1>
                <ElButton type="primary" class="w-22.5" v-ripple @click="editPwd">
                  {{ isEditPwd ? '保存' : '编辑' }}
                </ElButton>
              </div>

              <ElForm
                :model="pwdForm"
                class="user-center-form box-border p-5"
                label-width="86px"
                label-position="top"
              >
                <ElFormItem label="当前密码" prop="password">
                  <ElInput
                    v-model="pwdForm.password"
                    type="password"
                    :disabled="!isEditPwd"
                    show-password
                  />
                </ElFormItem>

                <ElFormItem label="新密码" prop="newPassword">
                  <ElInput
                    v-model="pwdForm.newPassword"
                    type="password"
                    :disabled="!isEditPwd"
                    show-password
                    placeholder="至少 8 位，含字母和数字"
                  />
                </ElFormItem>

                <ElFormItem label="确认新密码" prop="confirmPassword">
                  <ElInput
                    v-model="pwdForm.confirmPassword"
                    type="password"
                    :disabled="!isEditPwd"
                    show-password
                  />
                </ElFormItem>
              </ElForm>
            </ElTabPane>
          </ElTabs>
        </div>
      </div>
    </div>

    <JoinGenealogyDialog v-model:visible="joinVisible" @success="onJoinSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/store/modules/user'
  import type { FormInstance, FormRules } from 'element-plus'
  import avatarDefault from '@imgs/user/avatar.webp'
  import JoinGenealogyDialog from '@/components/business/join-genealogy-dialog/index.vue'

  defineOptions({ name: 'UserCenter' })

  const router = useRouter()
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  const activeTab = ref('profile')
  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const joinVisible = ref(false)
  const ruleFormRef = ref<FormInstance>()

  const displayName = computed(
    () => form.nickName || userInfo.value.userName || userInfo.value.nickName || '用户'
  )
  const avatarSrc = computed(() => userInfo.value.avatar || avatarDefault)

  const form = reactive({
    realName: '',
    nickName: '',
    email: '',
    mobile: '',
    address: '',
    sex: '1',
    des: ''
  })

  const pwdForm = reactive({
    password: '',
    newPassword: '',
    confirmPassword: ''
  })

  const rules = reactive<FormRules>({
    realName: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    nickName: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
    sex: [{ required: true, message: '请选择性别', trigger: 'change' }]
  })

  const options = [
    { value: '1', label: '男' },
    { value: '2', label: '女' }
  ]

  const labelList = ['修谱用户', '试用中', '家传云谱']

  const syncFromUserInfo = () => {
    form.nickName = userInfo.value.nickName || userInfo.value.userName || ''
    form.realName = userInfo.value.userName || ''
    form.email = userInfo.value.email || ''
    form.mobile = userInfo.value.phone || ''
    form.des = '家传云谱用户'
  }

  onMounted(() => {
    syncFromUserInfo()
  })

  watch(
    () => userInfo.value.userId,
    () => syncFromUserInfo()
  )

  const edit = () => {
    isEdit.value = !isEdit.value
  }

  const editPwd = () => {
    isEditPwd.value = !isEditPwd.value
  }

  const onJoinSuccess = () => {
    ElMessage.success('可在「我的族谱」中查看并进入')
    router.push('/genealogies')
  }
</script>

<style scoped>
  .user-center-page {
    height: var(--art-full-height);
  }

  .user-center-row {
    display: flex;
    align-items: stretch;
    gap: 20px;
    height: 100%;
  }

  .user-center-profile {
    flex-shrink: 0;
    width: 28rem;
  }

  .user-center-forms {
    flex: 1;
    min-width: 0;
  }

  .user-center-main {
    height: 100%;
  }

  .user-center-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .user-center-tabs {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .user-center-tabs :deep(.el-tabs__header) {
    margin: 0;
    padding: 12px 16px 0;
  }

  .user-center-tabs :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .user-center-tabs :deep(.el-tab-pane) {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .user-center-form {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--art-gray-300, var(--el-border-color));
  }

  @media (max-width: 768px) {
    .user-center-page {
      height: auto;
    }

    .user-center-row {
      display: block;
      height: auto;
    }

    .user-center-profile,
    .user-center-forms,
    .user-center-card {
      width: 100%;
      height: auto;
    }

    .user-center-forms {
      margin-top: 14px;
    }
  }
</style>
