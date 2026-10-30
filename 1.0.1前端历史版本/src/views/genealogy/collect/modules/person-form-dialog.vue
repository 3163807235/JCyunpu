<!-- 人物表单 · 首人「新增」/ 行内「添加子女」/ 编辑主系与配偶 · §3.4 · 分区+幼殇（文档待补） -->
<template>
  <ElDialog
    :model-value="visible"
    :title="dialogTitle"
    width="820px"
    align-center
    destroy-on-close
    @close="emit('update:visible', false)"
  >
    <p
      v-if="isAffinalSpouseEdit"
      class="mb-3 text-sm text-g-600 inline-flex items-center gap-1"
    >
      姻亲人物
      <PageTipIcon
        content="当前编辑的是婚配人物（姻亲）。可维护本人信息；与本家主系的婚配关系在主系人物上管理。"
      />
    </p>

    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" class="person-form">
      <!-- 短项统一一行四个（span=6） -->
      <ElRow :gutter="12">
        <ElCol :span="6">
          <ElFormItem label="姓">
            <ElInput
              v-model="personXing"
              maxlength="8"
              :placeholder="isAffinalSpouseEdit ? '配偶姓' : '本族姓'"
              @input="syncNameWei"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="名" prop="nameWei">
            <ElInput
              v-model="personMing"
              maxlength="32"
              placeholder="讳（本名）"
              @input="syncNameWei"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="字" prop="nameZi">
            <ElInput v-model="form.nameZi" maxlength="32" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="号" prop="nameHao">
            <ElInput v-model="form.nameHao" maxlength="64" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElFormItem v-if="isAffinalSpouseEdit" label="婚配对象（本家）">
        <ElInput :model-value="affinalPartnerNames" disabled />
      </ElFormItem>

      <ElRow :gutter="12">
        <ElCol :span="6">
          <ElFormItem label="性别" prop="gender">
            <ElSelect v-model="form.gender" class="w-full">
              <ElOption :value="1" label="男" />
              <ElOption :value="2" label="女" />
              <ElOption :value="0" label="未知" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="世代" prop="generation">
            <ElInputNumber
              v-model="form.generation"
              :min="1"
              :max="99"
              class="!w-full"
              :disabled="isAffinalSpouseEdit"
              @change="onGenerationChange"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem v-if="!isAffinalSpouseEdit" label="字辈" prop="zibei">
            <ElSelect
              v-model="form.zibei"
              filterable
              allow-create
              default-first-option
              clearable
              class="w-full"
              placeholder="按世代匹配"
            >
              <ElOption
                v-for="opt in zibeiSelectOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-else label="字辈">
            <ElInput model-value="姻亲不占本族字辈" disabled />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="!isAffinalSpouseEdit" :span="6">
          <ElFormItem label="排行" prop="xingdi">
            <ElSelect v-model="form.xingdi" clearable class="w-full" placeholder="数字排行">
              <ElOption
                v-for="opt in xingdiOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow v-if="!isAffinalSpouseEdit" :gutter="12">
        <ElCol :span="6">
          <ElFormItem label="出承">
            <ElSelect v-model="chuChengType" clearable class="w-full" placeholder="无">
              <ElOption value="chuji" label="出继" />
              <ElOption value="sifu" label="承嗣" />
              <ElOption value="jiantiao" label="兼祧" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol v-if="showMotherField" :span="6">
          <ElFormItem label="生母">
            <ElSelect
              v-if="canSelectMother"
              v-model="motherId"
              filterable
              clearable
              class="w-full"
              placeholder="父之多任配偶时选择"
            >
              <ElOption
                v-for="p in motherCandidates"
                :key="p.id"
                :label="`${p.nameWei}（第${p.generation}世）`"
                :value="p.id"
              />
            </ElSelect>
            <ElInput v-else :model-value="motherCandidates[0]?.nameWei || ''" disabled />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="chuChengType" :span="showMotherField ? 12 : 18">
          <ElFormItem :label="chuChengTargetLabel">
            <ElSelect
              v-model="chuChengTargetId"
              filterable
              class="w-full"
              :placeholder="`选择${chuChengTargetLabel}`"
            >
              <ElOption
                v-for="p in personOptions"
                :key="p.id"
                :label="`${p.nameWei}（${p.personNo} · 第${p.generation}世）`"
                :value="p.id"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="12">
        <ElCol :span="12">
          <ElFormItem label="生" prop="birthDate">
            <PersonLunarDateField
              v-model="form.birthDate"
              placeholder="出生公历日期"
              unknown-text="生年未详"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="籍贯 / 出生地" prop="nativePlace">
            <PersonPlaceField v-model="form.nativePlace" detail-placeholder="乡镇村组等（手填）" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="12">
        <ElCol :span="12">
          <ElFormItem label="卒" prop="deathDate">
            <div class="flex items-start gap-3 w-full">
              <PersonLunarDateField
                v-model="form.deathDate"
                class="flex-1 min-w-0"
                placeholder="逝世公历日期"
                unknown-text="卒年未详"
                @change="onDeathChange"
              />
              <ElCheckbox
                v-model="form.isYoushang"
                class="!mt-2 shrink-0"
                @change="onYoushangChange"
              >
                幼殇
              </ElCheckbox>
            </div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="卒地 / 墓葬" prop="burialPlace">
            <PersonPlaceField
              v-model="form.burialPlace"
              detail-placeholder="山向、穴位等（手填）"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 婚配主入口 · §3.4；隐私级别沿用默认族内可见，不在录入时打扰 -->
      <ElFormItem v-if="!isAffinalSpouseEdit" label="婚配">
        <div class="flex flex-col gap-2 w-full">
          <div
            v-for="(row, idx) in spouseRows"
            :key="row.key"
            class="flex items-center gap-2 w-full"
          >
            <ElSelect v-model="row.kind" class="!w-28 shrink-0">
              <ElOption v-for="k in spouseKindOptions" :key="k" :label="k" :value="k" />
            </ElSelect>
            <ElInput v-model="row.xing" class="!w-24 shrink-0" maxlength="8" placeholder="姓" />
            <ElInput v-model="row.name" class="flex-1" maxlength="32" placeholder="名" />
            <button
              v-if="spouseRows.length > 1"
              type="button"
              class="inline-flex items-center justify-center size-8 shrink-0 rounded-md bg-g-100 text-g-600 hover:bg-error/12 hover:text-error"
              title="移除"
              @click="removeSpouseRow(idx)"
            >
              <ArtSvgIcon icon="ri:close-line" class="text-base" />
            </button>
          </div>
          <ElButton link type="primary" class="!justify-start !px-0" @click="addSpouseRow">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            再添一项
          </ElButton>
        </div>
      </ElFormItem>

      <ElFormItem label="传记" prop="biography">
        <ElInput v-model="form.biography" type="textarea" :rows="2" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" v-ripple @click="submit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    fetchCreatePerson,
    fetchGenerationConfig,
    fetchPersonList,
    fetchUpdatePerson
  } from '@/api/person'
  import { fetchSubscriptionSummary, fetchGenealogyDetail } from '@/api/genealogy'
  import { fetchCreateRelation, fetchDeleteRelation, fetchRelationList } from '@/api/relationship'
  import { FATHER_REL_TYPES } from '@/mock/relationship'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import {
    XINGDI_RANK_OPTIONS,
    XINGDI_UNKNOWN,
    isXingdiUnknown,
    parseXingdiRank,
    suggestNextXingdiRank
  } from '@/utils/genealogy/xingdi'
  import PersonLunarDateField from './person-lunar-date-field.vue'
  import PersonPlaceField from './person-place-field.vue'

  defineOptions({ name: 'PersonFormDialog' })

  type ChuChengType = 'chuji' | 'sifu' | 'jiantiao' | ''
  /** 谱牒常用婚配称谓（产品文档未枚举，按传统谱例） */
  type SpouseKind = '娶' | '继娶' | '再娶' | '配' | '侧室' | '适' | '赘'

  interface SpouseRow {
    key: number
    kind: SpouseKind
    /** 配偶姓 */
    xing: string
    /** 配偶名（讳） */
    name: string
    /** 编辑回填时保留已有配偶人物 id */
    personId?: number
  }

  const SPOUSE_KINDS: SpouseKind[] = ['娶', '继娶', '再娶', '配', '侧室', '适', '赘']
  let spouseRowKey = 1

  const props = defineProps<{
    visible: boolean
    genealogyId: number
    editItem?: Api.Person.Item | null
    /** 行内「添加子女」：相对此人新建子女（与新增人物同一表单） */
    relateFrom?: Api.Person.Item | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const isEdit = computed(() => !!props.editItem?.id)
  const isAddChildMode = computed(() => !isEdit.value && !!props.relateFrom?.id)
  const xingdiOptions = XINGDI_RANK_OPTIONS
  const personOptions = ref<Api.Person.Item[]>([])
  /** 含当前编辑人，用于解析配偶/生母候选人 */
  const allPersons = ref<Api.Person.Item[]>([])
  const chuChengType = ref<ChuChengType>('')
  const chuChengTargetId = ref<number>()
  const spouseRows = ref<SpouseRow[]>([])
  const spouseKindOptions = SPOUSE_KINDS
  /** 编辑姻亲时：只读展示与本家的婚配对象 */
  const affinalPartnerNames = ref('')
  /** 是否编辑嫁入/婚配人物（无本族父系 + 有配偶边） */
  const isAffinalSpouseEdit = ref(false)
  /** 生母候选（父之配偶）；一任只读自动带入，多任可选 */
  const motherCandidates = ref<Api.Person.Item[]>([])
  const motherId = ref<number>()
  const showMotherField = computed(() => motherCandidates.value.length > 0)
  const canSelectMother = computed(() => motherCandidates.value.length > 1)
  /** 本族姓（来自族谱）；录入时自动填入「姓」 */
  const clanSurname = ref('')
  const personXing = ref('')
  const personMing = ref('')
  const genealogyStore = useGenealogyStore()
  /** 字辈派语，用于按世代自动匹配；下拉仍可手选 */
  const genPoemChars = ref<string[]>([])
  const genStartGen = ref(1)
  let skipGenAutoZibei = false

  const zibeiSelectOptions = computed(() =>
    genPoemChars.value.map((ch, i) => ({
      value: ch,
      label: `${ch}（第${genStartGen.value + i}世）`
    }))
  )

  const applyAutoZibei = () => {
    if (!genPoemChars.value.length) return
    const idx = form.generation - genStartGen.value
    if (idx >= 0 && idx < genPoemChars.value.length) {
      form.zibei = genPoemChars.value[idx]
    }
  }

  const onGenerationChange = () => {
    if (skipGenAutoZibei) return
    applyAutoZibei()
  }

  const loadGenerationConfig = async () => {
    try {
      const cfg = await fetchGenerationConfig(props.genealogyId)
      genStartGen.value = cfg.startGen || 1
      genPoemChars.value = (cfg.poem || '').replace(/\s/g, '').split('').filter(Boolean)
    } catch {
      genPoemChars.value = []
      genStartGen.value = 1
    }
  }

  const syncNameWei = () => {
    form.nameWei = `${personXing.value.trim()}${personMing.value.trim()}`
  }

  const applyNameParts = (full: string, preferClan = false) => {
    const clan = clanSurname.value.trim()
    if (clan && full.startsWith(clan) && full.length >= clan.length) {
      personXing.value = clan
      personMing.value = full.slice(clan.length)
    } else if (preferClan && clan) {
      personXing.value = clan
      personMing.value = full
    } else {
      personXing.value = ''
      personMing.value = full
    }
    syncNameWei()
  }

  const loadClanSurname = async () => {
    if (genealogyStore.current?.id === props.genealogyId && genealogyStore.current.surname) {
      clanSurname.value = genealogyStore.current.surname
      return
    }
    try {
      const g = await fetchGenealogyDetail(props.genealogyId)
      clanSurname.value = g.surname || ''
    } catch {
      clanSurname.value = ''
    }
  }

  const defaultSpouseKind = (): SpouseKind => (form.gender === 2 ? '适' : '娶')

  const makeSpouseRow = (partial?: Partial<SpouseRow>): SpouseRow => ({
    key: spouseRowKey++,
    kind: partial?.kind || defaultSpouseKind(),
    xing: partial?.xing || '',
    name: partial?.name || '',
    personId: partial?.personId
  })

  const addSpouseRow = () => {
    spouseRows.value.push(makeSpouseRow())
  }

  const removeSpouseRow = (idx: number) => {
    spouseRows.value.splice(idx, 1)
    if (!spouseRows.value.length) spouseRows.value.push(makeSpouseRow())
  }

  /** 清除历史脏数据里反复叠加的「（双向）」 */
  const stripBidirectionalNoise = (text: string) =>
    text
      .replace(/（双向）/gu, '')
      .replace(/\(双向\)/gi, '')
      .trim()

  /** 姓+名 → 人物讳；仅姓时记为「某氏」 */
  const spouseDisplayName = (xing: string, ming: string) => {
    const x = stripBidirectionalNoise(xing)
    const m = stripBidirectionalNoise(ming)
    if (x && m) return `${x}${m}`
    if (x) return `${x}氏`
    return m
  }

  const parseSpouseKind = (token: string): SpouseKind => {
    const hit = SPOUSE_KINDS.find((k) => token === k || token.startsWith(k))
    return hit || defaultSpouseKind()
  }

  /** 关系备注：`称谓|姓|名`（便于回填）；兼容旧数据仅存称谓 */
  const encodeSpouseRemark = (row: SpouseRow) => {
    const xing = stripBidirectionalNoise(row.xing)
    const name = stripBidirectionalNoise(row.name)
    return `${row.kind}|${xing}|${name}`
  }

  const decodeSpouseRemark = (remark?: string): Pick<SpouseRow, 'kind' | 'xing' | 'name'> => {
    const raw = stripBidirectionalNoise(remark || '')
    if (!raw || raw === '双向配偶') {
      return { kind: defaultSpouseKind(), xing: '', name: '' }
    }
    const parts = raw.split('|')
    if (parts.length >= 3) {
      return {
        kind: parseSpouseKind(parts[0] || ''),
        xing: stripBidirectionalNoise(parts[1] || ''),
        name: stripBidirectionalNoise(parts[2] || '')
      }
    }
    return { kind: parseSpouseKind(raw), xing: '', name: '' }
  }

  const form = reactive<Api.Person.FormParams>({
    nameWei: '',
    nameZi: '',
    nameHao: '',
    xingdi: '',
    zibei: '',
    generation: 1,
    gender: 1,
    birthDate: '',
    deathDate: '',
    isAlive: 1,
    isYoushang: false,
    nativePlace: '',
    burialPlace: '',
    biography: '',
    privacyLevel: 2,
    zibeiDoubt: false
  })

  const rules: FormRules = {
    nameWei: [{ required: true, message: '请输入名（讳）', trigger: 'blur' }],
    generation: [{ required: true, message: '请输入世代', trigger: 'change' }],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }]
  }

  const dialogTitle = computed(() => {
    if (isEdit.value) {
      const name = props.editItem?.nameWei || '人物'
      return `编辑【${name}】`
    }
    if (isAddChildMode.value && props.relateFrom) {
      return `添加【${props.relateFrom.nameWei}】子女`
    }
    return '新增人物'
  })

  const chuChengTargetLabel = computed(() => {
    if (chuChengType.value === 'chuji') return '出继对象'
    if (chuChengType.value === 'sifu') return '嗣父'
    if (chuChengType.value === 'jiantiao') return '兼祧父'
    return '关联人物'
  })

  /** 在世/已故仍由卒日推导；幼殇勾选时强制已故 */
  const syncAliveFromDeathAndYoushang = () => {
    if (form.isYoushang) {
      form.isAlive = 0
      return
    }
    form.isAlive = form.deathDate?.trim() ? 0 : 1
  }

  const onDeathChange = () => {
    syncAliveFromDeathAndYoushang()
  }

  const onYoushangChange = () => {
    syncAliveFromDeathAndYoushang()
  }

  const resetExtra = () => {
    chuChengType.value = ''
    chuChengTargetId.value = undefined
    spouseRows.value = [makeSpouseRow()]
    affinalPartnerNames.value = ''
    isAffinalSpouseEdit.value = false
    motherCandidates.value = []
    motherId.value = undefined
  }

  /** 收集某人的配偶人物 id（spouse / zhuixu，含双向） */
  const collectSpouseIds = (personId: number, rels: Api.Relationship.Item[]) => {
    const ids = new Set<number>()
    for (const r of rels) {
      if (r.relType !== 'spouse' && r.relType !== 'zhuixu') continue
      if (r.fromPersonId === personId) ids.add(r.toPersonId)
      if (r.toPersonId === personId) ids.add(r.fromPersonId)
    }
    return [...ids]
  }

  /**
   * 生母上下文：以「本人生父」的配偶为候选。
   * - 添加子女：relateFrom 为父则用其配偶；为母则找其配偶中的男性作为父再取其配偶
   * - 编辑：取当前人的 father 边指向的父
   */
  const resolveMotherContext = (
    rels: Api.Relationship.Item[],
    persons: Api.Person.Item[],
    opts?: { generation?: boolean; xingdi?: boolean }
  ) => {
    let fatherId: number | null = null
    if (isAddChildMode.value && props.relateFrom?.gender === 1) {
      fatherId = props.relateFrom.id
    } else if (isAddChildMode.value && props.relateFrom?.gender === 2) {
      // 从母亲添加：生母固定为当前人，仍解析父以算排行等
      const spouseIds = collectSpouseIds(props.relateFrom.id, rels)
      const father = persons.find((p) => spouseIds.includes(p.id) && p.gender === 1)
      fatherId = father?.id ?? null
      motherCandidates.value = [props.relateFrom]
      motherId.value = props.relateFrom.id
      return
    } else if (props.editItem?.id) {
      const fatherSet = new Set<string>(FATHER_REL_TYPES)
      const fRel = rels.find(
        (r) => r.fromPersonId === props.editItem!.id && fatherSet.has(r.relType)
      )
      fatherId = fRel?.toPersonId ?? null
    }

    if (!fatherId) {
      motherCandidates.value = []
      motherId.value = undefined
      return
    }
    const spouseIds = collectSpouseIds(fatherId, rels)
    motherCandidates.value = persons.filter((p) => spouseIds.includes(p.id))
    if (motherCandidates.value.length === 1) {
      motherId.value = motherCandidates.value[0].id
    } else if (
      motherId.value != null &&
      !motherCandidates.value.some((p) => p.id === motherId.value)
    ) {
      motherId.value = undefined
    }
    void opts
  }

  const applyChildDefaults = async (opts?: { generation?: boolean; xingdi?: boolean }) => {
    const anchor = props.relateFrom
    if (!anchor) return
    const touchGen = opts?.generation !== false
    const touchXingdi = opts?.xingdi !== false
    if (touchGen) {
      form.generation = Math.min(99, (anchor.generation || 1) + 1)
    }
    if (!touchXingdi) return
    try {
      const [rels, personRes] = await Promise.all([
        fetchRelationList(props.genealogyId),
        fetchPersonList({
          genealogyId: props.genealogyId,
          current: 1,
          size: 500,
          scope: 'active',
          lineageScope: 'all'
        })
      ])
      form.xingdi = suggestNextXingdiRank(anchor.id, form.gender, rels, personRes.records)
    } catch {
      form.xingdi = '1'
    }
  }

  const loadPersonOptions = async () => {
    const res = await fetchPersonList({
      genealogyId: props.genealogyId,
      current: 1,
      size: 500,
      scope: 'active',
      lineageScope: 'all'
    })
    allPersons.value = res.records
    personOptions.value = res.records.filter(
      (p) => p.id !== props.editItem?.id && p.id !== props.relateFrom?.id
    )
  }

  const loadRelationsForEdit = async (personId: number) => {
    const rels = await fetchRelationList(props.genealogyId)
    const nameMap = new Map(allPersons.value.map((p) => [p.id, p.nameWei]))
    const fatherSet = new Set<string>(FATHER_REL_TYPES)
    const self = allPersons.value.find((p) => p.id === personId)
    const hasFather = rels.some((r) => r.fromPersonId === personId && fatherSet.has(r.relType))
    const partnerIds = collectSpouseIds(personId, rels)

    isAffinalSpouseEdit.value = !hasFather && partnerIds.length > 0 && self?.gender !== 1
    affinalPartnerNames.value = partnerIds.map((id) => nameMap.get(id) || `#${id}`).join('、')

    // 出承回填
    const chu = rels.find(
      (r) =>
        r.fromPersonId === personId &&
        (r.relType === 'chuji' || r.relType === 'sifu' || r.relType === 'jiantiao')
    )
    if (chu) {
      chuChengType.value = chu.relType as ChuChengType
      chuChengTargetId.value = chu.toPersonId
    } else {
      // 承嗣/兼祧也可能记在 to 侧（子→父），from=子
      const asChild = rels.find(
        (r) => r.fromPersonId === personId && (r.relType === 'sifu' || r.relType === 'jiantiao')
      )
      if (asChild) {
        chuChengType.value = asChild.relType as ChuChengType
        chuChengTargetId.value = asChild.toPersonId
      }
    }

    // 生母回填
    const motherRel = rels.find((r) => r.fromPersonId === personId && r.relType === 'mother')
    if (motherRel) motherId.value = motherRel.toPersonId
    resolveMotherContext(rels, allPersons.value)

    // 配偶行回填（主系）
    if (!isAffinalSpouseEdit.value) {
      const spouseRels = rels.filter(
        (r) =>
          (r.relType === 'spouse' || r.relType === 'zhuixu') &&
          (r.fromPersonId === personId || r.toPersonId === personId)
      )
      if (spouseRels.length) {
        const seen = new Set<number>()
        const rows: SpouseRow[] = []
        for (const r of spouseRels) {
          const pid = r.fromPersonId === personId ? r.toPersonId : r.fromPersonId
          if (seen.has(pid)) continue
          seen.add(pid)
          const partner = allPersons.value.find((p) => p.id === pid)
          const decoded = decodeSpouseRemark(r.remark)
          let xing = decoded.xing
          let name = decoded.name
          if (!xing && !name && partner) {
            const full = partner.nameWei || ''
            if (full.endsWith('氏') && full.length >= 2) {
              xing = full.slice(0, -1)
              name = ''
            } else if (full.length >= 2) {
              xing = full.slice(0, 1)
              name = full.slice(1)
            } else {
              name = full
            }
          }
          const kind = r.relType === 'zhuixu' ? '赘' : decoded.kind || defaultSpouseKind()
          rows.push(makeSpouseRow({ kind, xing, name, personId: pid }))
        }
        spouseRows.value = rows.length ? rows : [makeSpouseRow()]
      } else {
        spouseRows.value = [makeSpouseRow()]
      }
    } else {
      spouseRows.value = [makeSpouseRow()]
    }
  }

  /** 编辑回填：数字直接用；不详 / 旧汉字文案尽量映射 */
  const normalizeXingdiValue = (xingdi?: string) => {
    if (isXingdiUnknown(xingdi)) return XINGDI_UNKNOWN
    const rank = parseXingdiRank(xingdi)
    if (rank) return String(rank)
    const t = (xingdi || '').trim()
    if (!t) return ''
    if (/^长[子女]?$/.test(t) || t === '之子' || t === '之女') return '1'
    if (/^(次|二)[子女]?$/.test(t)) return '2' // 次子/次女/二子 均映射为 2
    const m = t.match(/^([三四五六七八九]|十[一二]?)[子女]$/)
    if (m) {
      const map: Record<string, string> = {
        三: '3',
        四: '4',
        五: '5',
        六: '6',
        七: '7',
        八: '8',
        九: '9',
        十: '10',
        十一: '11',
        十二: '12'
      }
      return map[m[1]] || ''
    }
    return ''
  }

  const fillForm = (item?: Api.Person.Item | null) => {
    if (item) {
      Object.assign(form, {
        nameWei: item.nameWei,
        nameZi: item.nameZi || '',
        nameHao: item.nameHao || '',
        xingdi: normalizeXingdiValue(item.xingdi),
        zibei: item.zibei || '',
        generation: item.generation,
        gender: item.gender,
        birthDate: item.birthDate || '',
        deathDate: item.deathDate || '',
        isAlive: item.isAlive,
        isYoushang: !!item.isYoushang,
        nativePlace: item.nativePlace || '',
        burialPlace: item.burialPlace || '',
        biography: item.biography || '',
        privacyLevel: item.privacyLevel,
        zibeiDoubt: !!item.zibeiDoubt
      })
      applyNameParts(item.nameWei || '', false)
    } else {
      Object.assign(form, {
        nameWei: '',
        nameZi: '',
        nameHao: '',
        xingdi: '',
        zibei: '',
        generation: 1,
        gender: 1,
        birthDate: '',
        deathDate: '',
        isAlive: 1,
        isYoushang: false,
        nativePlace: '',
        burialPlace: '',
        biography: '',
        privacyLevel: 2,
        zibeiDoubt: false
      })
      // 新增：自动带入族谱姓氏
      applyNameParts('', true)
    }
  }

  watch(
    () => props.visible,
    async (open) => {
      if (!open) return
      resetExtra()
      skipGenAutoZibei = true
      try {
        await Promise.all([loadClanSurname(), loadGenerationConfig()])
        fillForm(props.editItem)
        if (isAddChildMode.value) await applyChildDefaults()
        if (!props.editItem?.id) applyAutoZibei()
        await loadPersonOptions()
        if (props.editItem?.id) {
          await loadRelationsForEdit(props.editItem.id)
        } else if (isAddChildMode.value) {
          const rels = await fetchRelationList(props.genealogyId)
          resolveMotherContext(rels, allPersons.value)
        }
      } catch (e: any) {
        ElMessage.error(e?.message || '加载失败')
      } finally {
        await nextTick()
        skipGenAutoZibei = false
      }
    }
  )

  watch(chuChengType, (val) => {
    if (!val) chuChengTargetId.value = undefined
  })

  /** 切换性别时，空名行的默认称谓随之调整（男→娶，女→适）；添加子女时重算建议排行 */
  watch(
    () => form.gender,
    async () => {
      spouseRows.value.forEach((row) => {
        if (!row.xing.trim() && !row.name.trim() && !row.personId) {
          row.kind = defaultSpouseKind()
        }
      })
      if (props.visible && isAddChildMode.value && !isEdit.value) {
        await applyChildDefaults({ generation: false, xingdi: true })
      }
    }
  )

  const resolveSpousePersonId = async (row: SpouseRow): Promise<number | null> => {
    const fullName = spouseDisplayName(row.xing, row.name)
    if (row.personId) {
      if (fullName) {
        await fetchUpdatePerson(row.personId, { nameWei: fullName })
      }
      return row.personId
    }
    if (!row.xing.trim() && !row.name.trim()) return null
    if (!fullName) return null

    let spouseGender: Api.Person.Gender = 0
    if (form.gender === 1) spouseGender = 2
    else if (form.gender === 2) spouseGender = 1

    const created = await fetchCreatePerson(
      props.genealogyId,
      {
        nameWei: fullName,
        gender: spouseGender,
        generation: form.generation,
        isAlive: 1,
        privacyLevel: form.privacyLevel
      },
      undefined
    )
    return created.id
  }

  /** 字辈与派语按世代不匹配时存疑（可存不拦截） */
  const syncZibeiDoubt = () => {
    if (isAffinalSpouseEdit.value || !form.zibei?.trim() || !genPoemChars.value.length) {
      form.zibeiDoubt = false
      return
    }
    const idx = form.generation - genStartGen.value
    const expected = idx >= 0 && idx < genPoemChars.value.length ? genPoemChars.value[idx] : ''
    form.zibeiDoubt = !!expected && form.zibei !== expected
  }

  const submit = async () => {
    syncNameWei()
    syncAliveFromDeathAndYoushang()
    syncZibeiDoubt()
    await formRef.value?.validate().catch(() => Promise.reject())
    if (chuChengType.value && !chuChengTargetId.value) {
      ElMessage.warning(`请选择${chuChengTargetLabel.value}`)
      return
    }

    submitting.value = true
    try {
      const summary = await fetchSubscriptionSummary()
      let personId = props.editItem?.id

      if (isEdit.value && personId) {
        await fetchUpdatePerson(personId, { ...form })
      } else {
        const created = await fetchCreatePerson(props.genealogyId, { ...form }, summary.personLimit)
        personId = created.id
      }

      if (!personId) throw new Error('保存失败')

      const allRels = await fetchRelationList(props.genealogyId)

      // 主系：同步婚配（删旧建新，保留特殊关系）
      if (!isAffinalSpouseEdit.value) {
        const spouseRels = allRels.filter(
          (r) =>
            (r.relType === 'spouse' || r.relType === 'zhuixu') &&
            (r.fromPersonId === personId || r.toPersonId === personId)
        )
        for (const r of spouseRels) await fetchDeleteRelation(r.id)

        for (const row of spouseRows.value) {
          const spouseId = await resolveSpousePersonId(row)
          if (!spouseId) continue
          const isZhuixu = row.kind === '赘'
          await fetchCreateRelation({
            genealogyId: props.genealogyId,
            fromPersonId: personId,
            toPersonId: spouseId,
            relType: isZhuixu ? 'zhuixu' : 'spouse',
            remark: encodeSpouseRemark(row)
          })
        }
      }

      // 出承：替换同类边
      const chuTypes: Api.Relationship.RelType[] = ['chuji', 'sifu', 'jiantiao']
      for (const r of allRels) {
        if (r.fromPersonId !== personId) continue
        if (!chuTypes.includes(r.relType)) continue
        await fetchDeleteRelation(r.id)
      }
      if (chuChengType.value && chuChengTargetId.value) {
        await fetchCreateRelation({
          genealogyId: props.genealogyId,
          fromPersonId: personId,
          toPersonId: chuChengTargetId.value,
          relType: chuChengType.value
        })
      }

      // 添加子女：挂父/母边
      if (isAddChildMode.value && props.relateFrom) {
        const anchor = props.relateFrom
        const parentType: Api.Relationship.RelType = anchor.gender === 2 ? 'mother' : 'father'
        const exists = allRels.some(
          (r) =>
            r.fromPersonId === personId &&
            r.toPersonId === anchor.id &&
            (FATHER_REL_TYPES.includes(r.relType) || r.relType === 'mother')
        )
        if (!exists) {
          await fetchCreateRelation({
            genealogyId: props.genealogyId,
            fromPersonId: personId,
            toPersonId: anchor.id,
            relType: parentType
          })
        }
      }

      // 生母边
      const motherRels = (await fetchRelationList(props.genealogyId)).filter(
        (r) => r.fromPersonId === personId && r.relType === 'mother'
      )
      for (const r of motherRels) await fetchDeleteRelation(r.id)
      const mid =
        motherId.value ??
        (motherCandidates.value.length === 1 ? motherCandidates.value[0].id : undefined)
      if (mid) {
        await fetchCreateRelation({
          genealogyId: props.genealogyId,
          fromPersonId: personId,
          toPersonId: mid,
          relType: 'mother'
        })
      }

      ElMessage.success('已保存')
      emit('update:visible', false)
      emit('success')
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      // Element Plus validate reject
      if (Array.isArray(e) || (e && typeof e === 'object' && !e.message)) return
      ElMessage.error(e?.message || '保存失败')
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  /* 压缩表单项纵向间距，方便一屏填写 */
  .person-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }
</style>
