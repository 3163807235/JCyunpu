<!-- 工作台 · v3.1.6 §3.4 日常管理区 -->
<template>
  <div v-loading="loading" class="genealogy-overview">
    <template v-if="detail">
      <GenealogyProgressBar
        :genealogy-id="detail.id"
        :mode="detail.mode"
        :current-stage="detail.currentStage"
      />

      <!-- 广录族人行动卡（非进度段） -->
      <button
        type="button"
        class="w-full art-card p-5 mb-5 text-left transition-colors border-2"
        :class="
          detail.personCount <= 0
            ? 'border-theme bg-theme/5 hover:bg-theme/10'
            : 'border-g-200 hover:border-theme/30'
        "
        @click="go('info/persons')"
      >
        <div class="flex-cb gap-3 flex-wrap">
          <div class="flex items-center gap-3 min-w-0">
            <div class="size-12 rounded-xl flex-cc bg-theme/10 shrink-0">
              <ArtSvgIcon icon="ri:user-add-line" class="text-xl text-theme" />
            </div>
            <div class="min-w-0">
              <p class="text-base font-medium">广录族人 →</p>
              <p class="text-sm text-g-500 mt-0.5">
                {{
                  detail.personCount <= 0
                    ? '尚未录入族人，点击前往信息管理开始录入'
                    : `已录入 ${detail.personCount} 人，继续维护人丁与关系`
                }}
              </p>
            </div>
          </div>
          <ElTag v-if="detail.personCount <= 0" type="danger" size="small">待录入</ElTag>
        </div>
      </button>

      <ElRow :gutter="20">
        <ElCol :xs="24" :md="14">
          <div class="art-card p-5 mb-5">
            <div class="flex-cb flex-wrap gap-2">
              <h2 class="text-xl font-medium">{{ detail.name }}</h2>
              <ElTag size="small">{{
                detail.mode === 'standard' ? '标准·五步成谱' : '简易·快捷成谱'
              }}</ElTag>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-g-500">姓氏</span>
                <p class="mt-1">{{ detail.surname || '未设' }}</p>
              </div>
              <div>
                <span class="text-g-500">堂号</span>
                <p class="mt-1">{{ detail.hallName || '未设' }}</p>
              </div>
              <div>
                <span class="text-g-500">始祖</span>
                <p class="mt-1">{{ detail.ancestor || '未设' }}</p>
              </div>
              <div>
                <span class="text-g-500">隐私</span>
                <p class="mt-1">{{ privacyLabel }}</p>
              </div>
              <div>
                <span class="text-g-500">创建时间</span>
                <p class="mt-1">{{ detail.createdAt }}</p>
              </div>
            </div>
          </div>
        </ElCol>

        <ElCol :xs="24" :md="10">
          <div class="art-card p-5 mb-5">
            <h3 class="text-base font-medium mb-4">人丁统计</h3>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="stat in stats" :key="stat.label">
                <p class="text-2xl font-medium">{{ stat.value }}</p>
                <p class="text-xs text-g-500 mt-1">{{ stat.label }}</p>
              </div>
            </div>
          </div>
        </ElCol>
      </ElRow>

      <div class="art-card p-5 mb-5">
        <h3 class="text-base font-medium mb-4">快捷入口</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="action in actions"
            :key="action.label"
            type="button"
            class="flex items-center gap-3 p-3 rounded-xl text-left border border-g-200 hover:border-theme/30 hover:bg-theme/5 transition-colors"
            :disabled="action.disabled"
            @click="action.onClick"
          >
            <div class="size-10 rounded-xl flex-cc bg-theme/10 shrink-0">
              <ArtSvgIcon :icon="action.icon" class="text-lg text-theme" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">{{ action.label }}</p>
              <p class="text-xs text-g-500 mt-0.5 truncate">{{ action.desc }}</p>
            </div>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useRoute, useRouter } from 'vue-router'
  import { fetchGenealogyDetail } from '@/api/genealogy'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { PRIVACY_LABELS, STAGE_LABELS } from '@/utils/genealogy/stage'
  import GenealogyProgressBar from '@/components/business/genealogy-progress-bar/index.vue'

  defineOptions({ name: 'GenealogyOverview' })

  const route = useRoute()
  const router = useRouter()
  const genealogyStore = useGenealogyStore()

  const loading = ref(false)
  const detail = ref<Api.Genealogy.Item | null>(null)

  const genealogyId = computed(() => Number(route.params.id))

  const privacyLabel = computed(() =>
    detail.value ? PRIVACY_LABELS[detail.value.privacy] : ''
  )

  const stats = computed(() => {
    if (!detail.value) return []
    return [
      { label: '总人物数', value: detail.value.personCount },
      { label: '附件数量', value: detail.value.attachmentCount },
      { label: '修谱项目', value: detail.value.projectCount },
      { label: '当前阶段', value: STAGE_LABELS[detail.value.currentStage] }
    ]
  })

  const go = (key: string) => {
    router.push(`/g/${genealogyId.value}/${key}`)
  }

  const actions = computed(() => [
    {
      label: '项目启动',
      desc: '信息 / 组编',
      icon: 'ri:flag-line',
      disabled: false,
      onClick: () => go('project')
    },
    {
      label: '新增人物',
      desc: '信息管理 · 人员列表',
      icon: 'ri:user-add-line',
      disabled: false,
      onClick: () => go('info/persons')
    },
    {
      label: '打开世系图',
      desc: '信息管理 · 关系图谱',
      icon: 'ri:node-tree',
      disabled: false,
      onClick: () => go('info/relations')
    },
    {
      label: '权限管理',
      desc: '协作与角色',
      icon: 'ri:team-line',
      disabled: false,
      onClick: () => go('settings/roles')
    },
    {
      label: '新建续修',
      desc: 'V1.5 上线',
      icon: 'ri:git-branch-line',
      disabled: true,
      onClick: () => ElMessage.info('续修将在 V1.5 上线')
    }
  ])

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      const item = await fetchGenealogyDetail(genealogyId.value)
      detail.value = item
      if (genealogyStore.currentGenealogyId !== item.id) {
        await genealogyStore.enterGenealogy(item, false)
      } else {
        genealogyStore.applyStageMenus()
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
      router.push('/genealogies')
    } finally {
      loading.value = false
    }
  }

  watch(genealogyId, load, { immediate: true })
</script>
