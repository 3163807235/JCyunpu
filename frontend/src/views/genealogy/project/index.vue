<!-- 项目启动 · §3.4 页面 04：期次卡片（首修/续修）→ 进入本期配置；全高对齐 StageShell -->
<template>
  <div v-loading="loading" class="genealogy-project art-full-height">
    <StageFlowActions class="shrink-0" :key="`flow-${hasActiveProject}`" :page-stage="1" />

    <!-- 期次列表：须先创建；每期组编与内容独立 · 续修 V1.5 -->
    <template v-if="view === 'list'">
      <div class="art-card p-5 flex-1 min-h-0 overflow-auto">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-1 text-sm text-g-600">
            <span>修谱期次</span>
            <PageTipIcon
              mode="popover"
              title="首修与续修"
              content="请先创建本期修谱项目后才会出现期次卡片。每一期（首修/续修）有独立项目信息、组编名单与谱书内容；续修将于 V1.5 开放。"
            />
          </div>
          <ElButton v-if="!hasActiveProject" type="primary" v-ripple @click="openCreateDialog">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            创建修谱项目
          </ElButton>
        </div>

        <!-- 尚未创建：与族谱列表 / 字辈等统一用 ElEmpty -->
        <ElEmpty v-if="showProjectEmpty" description="暂无修谱项目，创建后可配置本期信息与组编">
          <ElButton type="primary" plain v-ripple @click="openCreateDialog">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            立即创建
          </ElButton>
        </ElEmpty>

        <div v-else-if="showProjectCards" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <!-- 本期进行中（仅显式创建后展示） -->
          <button
            v-if="hasActiveProject"
            type="button"
            class="period-card period-card--active"
            @click="openDetail"
          >
            <div class="flex items-center gap-2 mb-3">
              <ElTag size="small" type="primary" effect="plain">
                {{ projectTypeLabel }}
              </ElTag>
              <ElTag size="small" type="success" effect="plain">进行中</ElTag>
            </div>
            <h3 class="period-card__title">{{ form.name || '未命名修谱项目' }}</h3>
            <p class="period-card__meta">
              {{ form.yearGanZhi || '—' }} · 公元 {{ form.yearAd || '—' }}
            </p>
            <p class="period-card__team">{{ teamSummary }}</p>
            <div class="period-card__footer">
              <span>配置本期团队</span>
              <ArtSvgIcon icon="ri:arrow-right-line" />
            </div>
          </button>

          <!-- 已归档期次（只读） -->
          <div
            v-for="snap in snapshots"
            :key="snap.id"
            class="period-card period-card--archived"
            role="group"
          >
            <div class="flex items-center gap-2 mb-3">
              <ElTag size="small" effect="plain">第 {{ snap.batchNo }} 期</ElTag>
              <ElTag size="small" type="info" effect="plain">已归档</ElTag>
            </div>
            <h3 class="period-card__title">{{ snap.title }}</h3>
            <p class="period-card__meta">{{ snap.createdAt }}</p>
            <p class="period-card__team">
              {{ snap.personCount }} 人 · {{ snap.pageCount }} 页 · {{ snap.summary || '定稿快照' }}
            </p>
            <div class="period-card__footer period-card__footer--muted">
              <span>只读封存</span>
              <ElButton link type="primary" @click.stop="goArchive">查看快照</ElButton>
            </div>
          </div>

          <!-- 无进行中项目时，归档旁仍可创建首修 -->
          <button
            v-if="!hasActiveProject && snapshots.length"
            type="button"
            class="period-card period-card--create"
            @click="openCreateDialog"
          >
            <div class="flex items-center gap-2 mb-3">
              <ElTag size="small" type="primary" effect="plain">首修</ElTag>
            </div>
            <h3 class="period-card__title">创建修谱项目</h3>
            <p class="period-card__meta">登记本期名称、年份与类型</p>
            <p class="period-card__team">创建后可配置组编并推进流程</p>
            <div class="period-card__footer">
              <span>立即创建</span>
              <ArtSvgIcon icon="ri:add-line" />
            </div>
          </button>

          <!-- 续修 · V1.5（有进行中或已归档时展示占位） -->
          <div
            v-if="hasActiveProject || snapshots.length"
            class="period-card period-card--locked"
            role="group"
            aria-disabled="true"
          >
            <div class="flex items-center gap-2 mb-3">
              <ElTag size="small" type="info" effect="plain">续修</ElTag>
              <ElTag size="small" type="warning" effect="plain">V1.5</ElTag>
            </div>
            <h3 class="period-card__title">发起下一期续修</h3>
            <p class="period-card__meta">独立组编、独立内容、继承活数据与章节</p>
            <p class="period-card__team">归档后可选择基准版本发起；本期不开放创建</p>
            <div class="period-card__footer period-card__footer--muted">
              <span>即将上线</span>
              <ArtSvgIcon icon="ri:lock-line" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 创建修谱项目 -->
    <ElDialog
      v-model="createVisible"
      title="创建修谱项目"
      width="480px"
      align-center
      destroy-on-close
      @closed="resetCreateForm"
    >
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <ElFormItem label="项目类型" prop="projectType">
          <ElRadioGroup v-model="createForm.projectType">
            <ElRadio :value="1">初始修谱（首修）</ElRadio>
            <ElRadio :value="2" disabled>续修（V1.5）</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="项目名称" prop="name">
          <ElInput
            v-model="createForm.name"
            maxlength="64"
            show-word-limit
            placeholder="如：颍川陈氏·丙午修谱"
          />
        </ElFormItem>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="修谱年份（干支）" prop="yearGanZhi">
              <ElInput v-model="createForm.yearGanZhi" placeholder="如：丙午" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="公元年份" prop="yearAd">
              <ElInputNumber v-model="createForm.yearAd" :min="1" :max="9999" class="!w-full" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton @click="createVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="creating" v-ripple @click="confirmCreate">
          创建
        </ElButton>
      </template>
    </ElDialog>

    <!-- 添加 / 编辑采编 · 居中弹窗 -->
    <ElDialog
      v-model="editorDialogVisible"
      :title="editorEditIndex == null ? '添加编委（房头采编）' : '编辑编委'"
      width="440px"
      align-center
      destroy-on-close
      @closed="resetEditorForm"
    >
      <ElForm ref="editorFormRef" :model="editorForm" :rules="editorRules" label-position="top">
        <ElFormItem label="席位">
          <ElInput model-value="编委 · 房头采编" disabled />
          <p class="mt-1 text-xs text-g-500">
            负责本房支人物、关系与史料采录；正式系统权限为「采编」。校勘/监修等席位 V1.5 开放。
          </p>
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput
            v-model="editorForm.phone"
            maxlength="11"
            placeholder="被邀请人 11 位手机号"
            clearable
          />
        </ElFormItem>
        <ElFormItem label="姓名 / 称谓" prop="displayName">
          <ElInput
            v-model="editorForm.displayName"
            maxlength="32"
            placeholder="可选，默认「编委·后四位」"
            clearable
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="editorDialogVisible = false">取消</ElButton>
        <ElButton type="primary" v-ripple @click="confirmEditorDialog">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 登记独立主编名录 · 居中弹窗（正式授权 V1.5） -->
    <ElDialog
      v-model="chiefDialogVisible"
      title="登记总纂（主编）"
      width="440px"
      align-center
      destroy-on-close
      @closed="resetChiefForm"
    >
      <ElForm ref="chiefFormRef" :model="chiefForm" :rules="chiefRules" label-position="top">
        <p class="mb-3 text-xs text-warning">
          独立总纂（主编）授权将在 V1.5 开放；此处先登记名录，本期流程仍由理事长（拥有者）代行总纂
          职责。
        </p>
        <ElFormItem label="总纂姓名" prop="name">
          <ElInput v-model="chiefForm.name" maxlength="32" placeholder="如：某某公" clearable />
        </ElFormItem>
        <ElFormItem label="联系手机" prop="phone">
          <ElInput
            v-model="chiefForm.phone"
            maxlength="11"
            placeholder="11 位手机号（可选）"
            clearable
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="chiefDialogVisible = false">取消</ElButton>
        <ElButton type="primary" v-ripple @click="confirmChiefDialog">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 本期详情：项目信息 + 团队配置（勿用 v-else：中间有 Dialog，会打断配对） -->
    <template v-if="view === 'detail'">
      <div class="flex flex-wrap items-center gap-2 mb-3 shrink-0">
        <ElButton text @click="backToList">
          <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />
          返回期次
        </ElButton>
        <ElTag size="small" type="primary" effect="plain">{{ projectTypeLabel }}</ElTag>
        <span class="text-sm text-g-600 truncate">{{ form.name || '本期配置' }}</span>
      </div>

      <div class="art-card p-5 flex-1 min-h-0 overflow-auto">
        <ElTabs v-model="activeTab">
          <!-- 默认进团队：立项已在创建弹窗完成，详情侧重组编 · §3.4 页面 04 -->
          <ElTabPane label="团队配置" name="team">
            <div class="flex-cb flex-wrap gap-2 mb-3">
              <div class="flex items-center gap-1 text-sm text-g-600 min-w-0">
                <span>本期修谱理事会</span>
                <PageTipIcon mode="popover" title="本期组编与长久协作" :width="460">
                  <p>
                    本表是<strong>本期修谱</strong>的理事会名录（项目级、随本期归档留存），不是族谱长久权限名单。
                  </p>
                  <p class="mt-1">
                    保存时仅对编委<strong>单向发出协作邀请</strong>（写入权限管理）；从本期名录移除不会撤销对方长久采编权限。撤权请到「角色管理」。
                  </p>
                  <p class="mt-1">
                    席位按传统修谱局编排：理事长/总纂/秘书长/财务一般为 1 人；编委等可多人。MVP
                    仅开放编委邀请，其余席位 V1.5 占位。
                  </p>
                </PageTipIcon>
                <span class="text-xs text-g-400 ml-1 shrink-0">
                  编委 {{ editors.length }} 人 · 本期名录
                </span>
              </div>
              <ElSpace wrap>
                <ElCheckbox
                  :model-value="form.chiefEditorByOwner !== false"
                  @update:model-value="onChiefByOwnerChange"
                >
                  理事长兼任总纂
                </ElCheckbox>
                <ElButton type="primary" plain v-ripple @click="openAddEditorDialog">
                  <ArtSvgIcon icon="ri:user-add-line" class="mr-1" />
                  添加编委
                </ElButton>
              </ElSpace>
            </div>

            <ElTable :data="teamTableRows" stripe border class="w-full mb-4">
              <ElTableColumn label="席位" width="150">
                <template #default="{ row }">
                  <div class="flex items-center gap-1.5">
                    <ArtSvgIcon :icon="row.icon" class="text-base text-theme shrink-0" />
                    <div class="min-w-0">
                      <p class="leading-tight">
                        {{ row.roleLabel }}
                        <span v-if="row.kind === 'editor'" class="text-xs text-g-400 font-normal">
                          ·{{ row.index + 1 }}
                        </span>
                      </p>
                      <p v-if="row.alias" class="text-xs text-g-400 leading-tight mt-0.5">
                        {{ row.alias }}
                      </p>
                    </div>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="编制" width="88" align="center">
                <template #default="{ row }">
                  <ElTag size="small" :type="row.multi ? 'primary' : 'info'" effect="plain">
                    {{ row.multi ? '可多人' : '1 人' }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="姓名 / 称谓" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <template v-if="row.kind === 'owner'">{{ ownerName }}</template>
                  <template v-else-if="row.kind === 'chief'">
                    <span v-if="form.chiefEditorByOwner" class="text-g-500">同理事长</span>
                    <span v-else>{{ form.chiefEditorName || '—' }}</span>
                  </template>
                  <template v-else-if="row.kind === 'editor'">
                    {{ editors[row.index].displayName || '—' }}
                  </template>
                  <template v-else-if="row.kind === 'editorSlot'">
                    <span class="text-g-400">尚未添加，可多人分房采录</span>
                  </template>
                  <span v-else-if="row.multi" class="text-g-400">可多人（V1.5）</span>
                  <span v-else class="text-g-400">—</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="手机号" width="130">
                <template #default="{ row }">
                  <template v-if="row.kind === 'owner'">{{ ownerPhone || '—' }}</template>
                  <template v-else-if="row.kind === 'chief'">
                    <span v-if="form.chiefEditorByOwner" class="text-g-500">—</span>
                    <span v-else>{{ form.chiefEditorPhone || '—' }}</span>
                  </template>
                  <template v-else-if="row.kind === 'editor'">
                    {{ editors[row.index].phone || '—' }}
                  </template>
                  <span v-else class="text-g-400">—</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="长久协作" width="108" align="center">
                <template #default="{ row }">
                  <template v-if="row.kind === 'owner'">
                    <ElTag size="small" type="success" effect="plain">固定</ElTag>
                  </template>
                  <template v-else-if="row.kind === 'editor'">
                    <ElTag
                      size="small"
                      :type="collabStatusMeta(editors[row.index]?.phone).type"
                      effect="plain"
                    >
                      {{ collabStatusMeta(editors[row.index]?.phone).label }}
                    </ElTag>
                  </template>
                  <span v-else class="text-xs text-g-400">—</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="职责说明" min-width="240">
                <template #default="{ row }">
                  <div class="py-1">
                    <ElTag
                      v-if="row.tag"
                      size="small"
                      :type="row.tagType"
                      effect="plain"
                      class="mb-1"
                    >
                      {{ row.tag }}
                    </ElTag>
                    <p class="text-xs text-g-600 leading-relaxed">{{ row.duty }}</p>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="140" fixed="right">
                <template #default="{ row }">
                  <template v-if="row.kind === 'editor'">
                    <ElButton link type="primary" @click="openEditEditorDialog(row.index)">
                      编辑
                    </ElButton>
                    <ElButton link type="danger" @click="removeEditor(row.index)">移除</ElButton>
                  </template>
                  <ElButton
                    v-else-if="row.kind === 'editorSlot'"
                    link
                    type="primary"
                    @click="openAddEditorDialog"
                  >
                    添加
                  </ElButton>
                  <ElButton
                    v-else-if="row.kind === 'chief' && !form.chiefEditorByOwner"
                    link
                    type="primary"
                    @click="openChiefDialog"
                  >
                    编辑
                  </ElButton>
                  <span v-else class="text-xs text-g-400">—</span>
                </template>
              </ElTableColumn>
            </ElTable>

            <div class="flex flex-wrap items-center gap-2">
              <ElButton type="primary" :loading="saving" v-ripple @click="saveTeam">
                保存本期组编
              </ElButton>
              <ElButton plain @click="goRoles">
                <ArtSvgIcon icon="ri:user-settings-line" class="mr-1" />
                长久协作（角色管理）
              </ElButton>
              <span class="text-xs text-g-400">保存只加邀，不撤权</span>
            </div>
          </ElTabPane>

          <ElTabPane label="项目信息" name="info">
            <div class="max-w-xl">
              <div class="flex-cb flex-wrap gap-2 mb-4">
                <p class="text-sm text-g-500">立项时已登记；如需更正可点编辑。</p>
                <ElButton v-if="!editingInfo" type="primary" plain v-ripple @click="startEditInfo">
                  <ArtSvgIcon icon="ri:edit-line" class="mr-1" />
                  编辑
                </ElButton>
              </div>

              <ElDescriptions v-if="!editingInfo" :column="1" border>
                <ElDescriptionsItem label="项目名称">
                  {{ form.name || '—' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="修谱年份（干支）">
                  {{ form.yearGanZhi || '—' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="公元年份">
                  {{ form.yearAd || '—' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="项目类型">
                  <ElTag
                    :type="form.projectType === 1 ? 'primary' : 'info'"
                    size="small"
                    effect="plain"
                  >
                    {{ projectTypeLabel }}
                  </ElTag>
                  <span class="ml-2 text-xs text-g-500">续修类型将在 V1.5 开放</span>
                </ElDescriptionsItem>
              </ElDescriptions>

              <ElForm v-else :model="form" label-position="top">
                <ElFormItem label="项目名称">
                  <ElInput v-model="form.name" maxlength="64" show-word-limit />
                </ElFormItem>
                <ElRow :gutter="16">
                  <ElCol :span="12">
                    <ElFormItem label="修谱年份（干支）">
                      <ElInput v-model="form.yearGanZhi" placeholder="如：丙午" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="12">
                    <ElFormItem label="公元年份">
                      <ElInputNumber v-model="form.yearAd" :min="1" :max="9999" class="!w-full" />
                    </ElFormItem>
                  </ElCol>
                </ElRow>
                <ElFormItem label="项目类型">
                  <div class="flex flex-wrap items-center gap-2">
                    <ElTag :type="form.projectType === 1 ? 'primary' : 'info'" effect="plain">
                      {{ projectTypeLabel }}
                    </ElTag>
                    <span class="text-xs text-g-500">续修类型将在 V1.5 随续修发起一并开放</span>
                  </div>
                </ElFormItem>
                <div class="flex flex-wrap gap-2">
                  <ElButton type="primary" :loading="saving" v-ripple @click="saveInfo">
                    保存
                  </ElButton>
                  <ElButton @click="cancelEditInfo">取消</ElButton>
                </div>
              </ElForm>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { useRoute, useRouter } from 'vue-router'
  import { fetchGenealogyProject, fetchSaveGenealogyProject } from '@/api/genealogy'
  import { fetchCollaboratorList, fetchInviteCollaborator } from '@/api/collaborator'
  import { fetchSnapshots } from '@/api/workflow'
  import { useUserStore } from '@/store/modules/user'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import StageFlowActions from '@/components/business/stage-flow-actions/index.vue'

  defineOptions({ name: 'GenealogyProject' })

  useGenealogyContext()

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const genealogyStore = useGenealogyStore()

  interface EditorRow {
    key: number
    phone: string
    displayName: string
  }

  let editorKey = 1

  const loading = ref(false)
  const saving = ref(false)
  const creating = ref(false)
  const createVisible = ref(false)
  const createFormRef = ref<FormInstance>()
  const view = ref<'list' | 'detail'>('list')
  /** 详情默认团队配置：立项字段已在创建弹窗登记 */
  const activeTab = ref<'team' | 'info'>('team')
  const editingInfo = ref(false)
  const infoSnapshot = ref({ name: '', yearGanZhi: '', yearAd: 0 })
  const editors = ref<EditorRow[]>([])
  /** 长久协作名单（只读对照，不反向改本期名录） */
  const collabByPhone = ref<Map<string, Api.Collaborator.Item>>(new Map())
  const snapshots = ref<Api.Archive.Snapshot[]>([])

  const editorDialogVisible = ref(false)
  const editorFormRef = ref<FormInstance>()
  const editorEditIndex = ref<number | null>(null)
  const editorForm = reactive({ phone: '', displayName: '' })
  const editorRules: FormRules = {
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
    ]
  }

  const chiefDialogVisible = ref(false)
  const chiefFormRef = ref<FormInstance>()
  const chiefForm = reactive({ name: '', phone: '' })
  const chiefRules: FormRules = {
    name: [{ required: true, message: '请填写总纂姓名', trigger: 'blur' }],
    phone: [{ pattern: /^$|^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }]
  }

  const genealogyId = computed(() => Number(route.params.id))
  const ownerName = computed(
    () => userStore.getUserInfo.nickName || userStore.getUserInfo.userName || '当前用户'
  )
  const ownerPhone = computed(() => userStore.getUserInfo.phone || '')

  type TeamTableRow = {
    kind: 'owner' | 'chief' | 'editor' | 'editorSlot' | 'locked'
    index?: number
    roleLabel: string
    alias?: string
    icon: string
    tag: string
    tagType: 'success' | 'info' | 'warning' | 'primary'
    duty: string
    /** 传统修谱局中该席位是否允许多人共职 */
    multi: boolean
  }

  /** 传统修谱局席位 + 系统角色映射；编委等可多人 · §1.9 / §3.4 页面 04 */
  const teamTableRows = computed<TeamTableRow[]>(() => {
    const editorDuty =
      '分房采集本支人物、亲属关系、附件与口述史料；同一席位可多人分房协作。保存本期组编时向未在协作名单者发出长久邀请。'

    const editorRows: TeamTableRow[] = editors.value.length
      ? editors.value.map(
          (_e, index): TeamTableRow => ({
            kind: 'editor',
            index,
            roleLabel: '编委',
            alias: '房头采编',
            icon: 'ri:group-line',
            tag: 'MVP 可邀请',
            tagType: 'primary',
            multi: true,
            duty: editorDuty
          })
        )
      : [
          {
            kind: 'editorSlot',
            roleLabel: '编委',
            alias: '房头采编',
            icon: 'ri:group-line',
            tag: 'MVP 可邀请',
            tagType: 'primary',
            multi: true,
            duty: editorDuty
          }
        ]

    return [
      {
        kind: 'owner',
        roleLabel: '理事长',
        alias: '族谱拥有者',
        icon: 'ri:vip-crown-line',
        tag: '固定席位',
        tagType: 'success',
        multi: false,
        duty: '发起并主持本期修谱，统筹人财物与对外联络；席位唯一，协作操作消耗其订阅额度，不可移除。'
      },
      {
        kind: 'chief',
        roleLabel: '总纂',
        alias: '谱局主编',
        icon: 'ri:edit-2-line',
        tag: form.chiefEditorByOwner ? '理事长兼任' : '名录登记',
        tagType: 'info',
        multi: false,
        duty: form.chiefEditorByOwner
          ? '统揽凡例、谱文与世系规整，推进流程与终审；席位通常 1 人，MVP 由理事长兼任。'
          : '统揽编纂质量与流程推进（通常 1 人）；独立授权 V1.5 开放，本期先登记名录。'
      },
      ...editorRows,
      {
        kind: 'locked',
        roleLabel: '副总纂',
        alias: '副主编',
        icon: 'ri:user-star-line',
        tag: 'V1.5',
        tagType: 'warning',
        multi: true,
        duty: '协助总纂审稿与分卷统筹；可多人按篇章/房支分管，交叉校对。'
      },
      {
        kind: 'locked',
        roleLabel: '校勘委员',
        alias: '校勘员',
        icon: 'ri:search-eye-line',
        tag: 'V1.5',
        tagType: 'warning',
        multi: true,
        duty: '三校勘误、批注疑点、复核整改；可多人分卷会审（现由理事长代行）。'
      },
      {
        kind: 'locked',
        roleLabel: '房支联络',
        alias: '分支负责人',
        icon: 'ri:git-branch-line',
        tag: 'V1.5',
        tagType: 'warning',
        multi: true,
        duty: '各房支一对一联络与催收；可多人，每人限定本支世代范围。'
      },
      {
        kind: 'locked',
        roleLabel: '监修 / 顾问',
        alias: '德望指导',
        icon: 'ri:shield-star-line',
        tag: 'V1.5',
        tagType: 'warning',
        multi: true,
        duty: '德高望重长辈把关体例与重大史实；可设多名顾问，不参与日常录入。'
      },
      {
        kind: 'locked',
        roleLabel: '秘书长',
        alias: '会务统筹',
        icon: 'ri:mail-send-line',
        tag: 'V1.5',
        tagType: 'warning',
        multi: false,
        duty: '会议纪要、进度督办与对外文书；席位通常 1 人，衔接决议与编委执行。'
      },
      {
        kind: 'locked',
        roleLabel: '财务',
        alias: '账务经办',
        icon: 'ri:wallet-3-line',
        tag: 'V1.5',
        tagType: 'warning',
        multi: false,
        duty: '登记捐资、开支与印刷结算并公示；席位通常 1 人（可另设出纳，后续开放）。'
      },
      {
        kind: 'locked',
        roleLabel: '只读列席',
        alias: '只读浏览',
        icon: 'ri:eye-line',
        tag: 'V1.5',
        tagType: 'warning',
        multi: true,
        duty: '族内知情列席，可阅览进度与谱稿；可多人，不可编辑或推进流程。'
      }
    ]
  })

  const form = reactive<Api.Genealogy.ProjectInfo>({
    name: '',
    yearGanZhi: '',
    yearAd: new Date().getFullYear(),
    projectType: 1,
    fanliHtml: '',
    collabPhones: [],
    chiefEditorByOwner: true,
    chiefEditorName: '',
    chiefEditorPhone: '',
    editors: [],
    initialized: false
  })

  const createForm = reactive({
    projectType: 1 as 1 | 2,
    name: '',
    yearGanZhi: '',
    yearAd: new Date().getFullYear()
  })

  const createRules: FormRules = {
    name: [{ required: true, message: '请填写项目名称', trigger: 'blur' }],
    yearAd: [{ required: true, message: '请填写公元年份', trigger: 'change' }]
  }

  const hasActiveProject = computed(() => form.initialized === true)
  const showProjectEmpty = computed(
    () => !loading.value && !hasActiveProject.value && !snapshots.value.length
  )
  const showProjectCards = computed(
    () => !loading.value && (hasActiveProject.value || snapshots.value.length > 0)
  )

  const projectTypeLabel = computed(() => (form.projectType === 2 ? '续修' : '初始修谱（首修）'))

  const teamSummary = computed(() => {
    const chief =
      form.chiefEditorByOwner !== false
        ? '理事长兼任总纂'
        : `总纂 ${form.chiefEditorName || '待登记'}`
    const editorCount = editors.value.filter((e) => e.phone.trim()).length
    return `${chief} · 编委 ${editorCount} 人`
  })

  const makeEditorRow = (partial?: Partial<EditorRow>): EditorRow => ({
    key: editorKey++,
    phone: partial?.phone || '',
    displayName: partial?.displayName || ''
  })

  const applyEditorsFromForm = () => {
    // 本期名录以 editors 为准；仅旧数据无 editors 时用 collabPhones 迁移，不与长久协作合并
    const list = form.editors?.length
      ? form.editors
      : (form.collabPhones || []).map((phone) => ({ phone, displayName: '' }))
    editors.value = list.length ? list.map((e) => makeEditorRow(e)) : []
  }

  const ownerPayload = computed(() => {
    const info = userStore.getUserInfo
    return {
      userId: Number(info.userId) || 10001,
      displayName: info.nickName || info.userName || '拥有者',
      phone: info.phone || '13800138000'
    }
  })

  const loadCollaborators = async () => {
    if (!genealogyId.value) return
    try {
      const data = await fetchCollaboratorList(genealogyId.value, ownerPayload.value)
      const map = new Map<string, Api.Collaborator.Item>()
      for (const item of data.list) {
        if (item.role === 'owner') continue
        if (item.inviteStatus === 2 || item.inviteStatus === 4) continue
        map.set(item.phone, item)
      }
      collabByPhone.value = map
    } catch {
      collabByPhone.value = new Map()
    }
  }

  const collabStatusMeta = (phone?: string) => {
    const p = (phone || '').trim()
    if (!p) return { label: '—', type: 'info' as const }
    const item = collabByPhone.value.get(p)
    if (!item) return { label: '未邀请', type: 'info' as const }
    if (item.inviteStatus === 1) return { label: '已加入', type: 'success' as const }
    if (item.inviteStatus === 0) return { label: '待接受', type: 'warning' as const }
    if (item.inviteStatus === 3) return { label: '已过期', type: 'danger' as const }
    return { label: '未邀请', type: 'info' as const }
  }

  const collectEditorsPayload = (): Api.Genealogy.ProjectEditorSeat[] => {
    const rows: Api.Genealogy.ProjectEditorSeat[] = []
    const seen = new Set<string>()
    for (const row of editors.value) {
      const phone = row.phone.trim()
      if (!phone) continue
      if (!/^1\d{10}$/.test(phone)) {
        throw new Error(`手机号不合法：${phone}`)
      }
      if (seen.has(phone)) {
        throw new Error(`编委手机号重复：${phone}`)
      }
      seen.add(phone)
      rows.push({
        phone,
        displayName: row.displayName.trim() || `编委·${phone.slice(-4)}`
      })
    }
    return rows
  }

  const buildSavePayload = (): Api.Genealogy.ProjectInfo => {
    const editorSeats = collectEditorsPayload()
    return {
      ...form,
      projectType: form.projectType === 2 ? 2 : 1,
      initialized: true,
      chiefEditorByOwner: form.chiefEditorByOwner !== false,
      chiefEditorName: form.chiefEditorByOwner ? '' : (form.chiefEditorName || '').trim(),
      chiefEditorPhone: form.chiefEditorByOwner ? '' : (form.chiefEditorPhone || '').trim(),
      editors: editorSeats,
      collabPhones: editorSeats.map((e) => e.phone)
    }
  }

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      const [data, snaps] = await Promise.all([
        fetchGenealogyProject(genealogyId.value),
        fetchSnapshots(genealogyId.value).catch(() => [] as Api.Archive.Snapshot[])
      ])
      Object.assign(form, data)
      if (form.chiefEditorByOwner === undefined) form.chiefEditorByOwner = true
      applyEditorsFromForm()
      snapshots.value = [...snaps].sort((a, b) => b.batchNo - a.batchNo)
      await loadCollaborators()
      if (!form.initialized) view.value = 'list'
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const openCreateDialog = () => {
    const gName = genealogyStore.current?.name?.trim()
    createForm.projectType = 1
    createForm.name = form.name?.trim() || (gName ? `${gName}·初始修谱` : '')
    createForm.yearGanZhi = form.yearGanZhi || ''
    createForm.yearAd = form.yearAd || new Date().getFullYear()
    createVisible.value = true
  }

  const resetCreateForm = () => {
    createForm.projectType = 1
    createForm.name = ''
    createForm.yearGanZhi = ''
    createForm.yearAd = new Date().getFullYear()
    createFormRef.value?.resetFields()
  }

  const confirmCreate = async () => {
    const ok = await createFormRef.value?.validate().catch(() => false)
    if (!ok) return
    if (createForm.projectType === 2) {
      ElMessage.warning('续修将在 V1.5 开放')
      return
    }
    creating.value = true
    try {
      const payload: Api.Genealogy.ProjectInfo = {
        ...form,
        name: createForm.name.trim(),
        yearGanZhi: createForm.yearGanZhi.trim(),
        yearAd: createForm.yearAd,
        projectType: 1,
        initialized: true,
        chiefEditorByOwner: true,
        chiefEditorName: '',
        chiefEditorPhone: '',
        editors: form.editors || [],
        collabPhones: form.collabPhones || []
      }
      Object.assign(form, await fetchSaveGenealogyProject(genealogyId.value, payload))
      applyEditorsFromForm()
      createVisible.value = false
      ElMessage.success('项目已创建，请配置本期团队')
      editingInfo.value = false
      view.value = 'detail'
      activeTab.value = 'team'
    } catch (e: any) {
      ElMessage.error(e?.message || '创建失败')
    } finally {
      creating.value = false
    }
  }

  const openDetail = () => {
    if (!hasActiveProject.value) {
      openCreateDialog()
      return
    }
    editingInfo.value = false
    view.value = 'detail'
    activeTab.value = 'team'
  }

  const backToList = () => {
    editingInfo.value = false
    view.value = 'list'
  }

  const startEditInfo = () => {
    infoSnapshot.value = {
      name: form.name || '',
      yearGanZhi: form.yearGanZhi || '',
      yearAd: form.yearAd || new Date().getFullYear()
    }
    editingInfo.value = true
  }

  const cancelEditInfo = () => {
    form.name = infoSnapshot.value.name
    form.yearGanZhi = infoSnapshot.value.yearGanZhi
    form.yearAd = infoSnapshot.value.yearAd
    editingInfo.value = false
  }

  const saveInfo = async () => {
    saving.value = true
    try {
      const payload = buildSavePayload()
      Object.assign(form, await fetchSaveGenealogyProject(genealogyId.value, payload))
      applyEditorsFromForm()
      editingInfo.value = false
      ElMessage.success('项目信息已保存')
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  const saveTeam = async () => {
    if (!form.chiefEditorByOwner) {
      const phone = (form.chiefEditorPhone || '').trim()
      if (phone && !/^1\d{10}$/.test(phone)) {
        ElMessage.warning('总纂手机号不合法')
        return
      }
    }
    saving.value = true
    try {
      const payload = buildSavePayload()
      Object.assign(form, await fetchSaveGenealogyProject(genealogyId.value, payload))
      applyEditorsFromForm()

      const userId = Number(userStore.getUserInfo.userId) || 10001
      let invited = 0
      let skipped = 0
      for (const seat of payload.editors || []) {
        try {
          await fetchInviteCollaborator(
            genealogyId.value,
            { phone: seat.phone, displayName: seat.displayName, role: 'editor' },
            userId
          )
          invited += 1
        } catch (e: any) {
          const msg = String(e?.message || '')
          if (
            msg.includes('已在协作名单') ||
            msg.includes('不能邀请拥有者') ||
            msg.includes('协作人数已达上限') ||
            msg.includes('已存在') ||
            msg.includes('已邀请')
          ) {
            skipped += 1
            if (msg.includes('协作人数已达上限')) {
              ElMessage.warning(msg)
            }
          } else {
            throw e
          }
        }
      }
      await loadCollaborators()
      const tip =
        invited > 0
          ? `本期组编已保存，向 ${invited} 人发出长久协作邀请${skipped ? `，${skipped} 人已在协作名单` : ''}`
          : skipped
            ? '本期组编已保存（编委均已在长久协作名单中）'
            : '本期组编已保存'
      ElMessage.success(tip)
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  const openAddEditorDialog = () => {
    editorEditIndex.value = null
    editorForm.phone = ''
    editorForm.displayName = ''
    editorDialogVisible.value = true
  }

  const openEditEditorDialog = (idx: number) => {
    const row = editors.value[idx]
    if (!row) return
    editorEditIndex.value = idx
    editorForm.phone = row.phone
    editorForm.displayName = row.displayName
    editorDialogVisible.value = true
  }

  const resetEditorForm = () => {
    editorEditIndex.value = null
    editorForm.phone = ''
    editorForm.displayName = ''
    editorFormRef.value?.resetFields()
  }

  const confirmEditorDialog = async () => {
    const ok = await editorFormRef.value?.validate().catch(() => false)
    if (!ok) return
    const phone = editorForm.phone.trim()
    const displayName = editorForm.displayName.trim()
    const dup = editors.value.some(
      (e, i) => e.phone.trim() === phone && i !== editorEditIndex.value
    )
    if (dup) {
      ElMessage.warning('该手机号已在采编名单中')
      return
    }
    if (editorEditIndex.value == null) {
      editors.value.push(makeEditorRow({ phone, displayName }))
    } else {
      const row = editors.value[editorEditIndex.value]
      if (row) {
        row.phone = phone
        row.displayName = displayName
      }
    }
    editorDialogVisible.value = false
  }

  const removeEditor = async (idx: number) => {
    const row = editors.value[idx]
    if (!row) return
    try {
      await ElMessageBox.confirm(
        `将「${row.displayName || row.phone}」从本期理事会名录移除。\n不会撤销其长久采编权限；若需撤权，请到角色管理操作。`,
        '仅移除本期名录',
        {
          type: 'warning',
          confirmButtonText: '仅移除名录',
          cancelButtonText: '取消'
        }
      )
    } catch {
      return
    }
    editors.value.splice(idx, 1)
  }

  const onChiefByOwnerChange = (val: string | number | boolean) => {
    if (val === true) {
      form.chiefEditorByOwner = true
      form.chiefEditorName = ''
      form.chiefEditorPhone = ''
      return
    }
    // 取消勾选：弹窗登记后再落地；取消弹窗则仍保持兼任
    openChiefDialog()
  }

  const openChiefDialog = () => {
    chiefForm.name = form.chiefEditorName || ''
    chiefForm.phone = form.chiefEditorPhone || ''
    chiefDialogVisible.value = true
  }

  const resetChiefForm = () => {
    chiefForm.name = ''
    chiefForm.phone = ''
    chiefFormRef.value?.resetFields()
  }

  const confirmChiefDialog = async () => {
    const ok = await chiefFormRef.value?.validate().catch(() => false)
    if (!ok) return
    form.chiefEditorByOwner = false
    form.chiefEditorName = chiefForm.name.trim()
    form.chiefEditorPhone = chiefForm.phone.trim()
    chiefDialogVisible.value = false
  }

  const goRoles = () => {
    router.push(`/g/${genealogyId.value}/settings/roles`)
  }

  const goArchive = () => {
    router.push(`/g/${genealogyId.value}/archive`)
  }

  watch(
    genealogyId,
    () => {
      view.value = 'list'
      load()
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .period-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    text-align: left;
    width: 100%;
    min-height: 200px;
    padding: 18px 18px 14px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;

    &__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--el-text-color-primary);
    }

    &__meta {
      margin: 8px 0 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    &__team {
      margin: 8px 0 0;
      font-size: 12px;
      color: var(--el-text-color-regular);
      flex: 1;
    }

    &__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-extra-light);
      font-size: 13px;
      color: var(--el-color-primary);

      &--muted {
        color: var(--el-text-color-secondary);
      }
    }

    &--active {
      cursor: pointer;

      &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 6px 20px rgb(0 0 0 / 6%);
        transform: translateY(-1px);
      }
    }

    &--archived {
      background: var(--el-fill-color-blank);
    }

    &--locked {
      border-style: dashed;
      background: var(--el-fill-color-lighter);
      opacity: 0.92;
    }

    &--create {
      cursor: pointer;
      border-style: dashed;
      border-color: var(--el-color-primary-light-5);

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 6px 20px rgb(0 0 0 / 6%);
      }
    }
  }
</style>
