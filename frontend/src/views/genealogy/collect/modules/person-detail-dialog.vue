<!-- 人物详情（只读）· §3.4 人员列表「查看详情」；主系与姻亲分开展示 -->
<template>
  <ElDialog
    :model-value="visible"
    :title="dialogTitle"
    width="640px"
    align-center
    destroy-on-close
    @close="emit('update:visible', false)"
  >
    <template v-if="person">
      <div class="mb-3">
        <ElTag :type="affinal ? 'warning' : 'success'" effect="plain" size="small">
          {{ affinal ? '姻亲' : '本族' }}
        </ElTag>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="名讳">{{ person.nameWei || '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="性别">{{ genderLabel(person.gender) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="字">{{ person.nameZi || '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="号">{{ person.nameHao || '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="编号">{{ person.personNo }}</ElDescriptionsItem>
        <ElDescriptionsItem label="世代">第{{ person.generation }}世</ElDescriptionsItem>

        <template v-if="!affinal">
          <ElDescriptionsItem label="字辈">
            {{ person.zibei || '—' }}
            <ElTag v-if="person.zibeiDoubt" size="small" type="warning" class="ml-1">存疑</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="排行">{{ xingdiLabel }}</ElDescriptionsItem>
          <ElDescriptionsItem label="父亲">{{ fatherLabel }}</ElDescriptionsItem>
          <ElDescriptionsItem label="生母">{{ motherLabel }}</ElDescriptionsItem>
          <ElDescriptionsItem label="出承" :span="2">{{ chuChengLabel }}</ElDescriptionsItem>
          <ElDescriptionsItem label="婚配" :span="2">{{ spouseLabel }}</ElDescriptionsItem>
          <ElDescriptionsItem label="子女" :span="2">{{ childrenLabel }}</ElDescriptionsItem>
        </template>

        <template v-else>
          <ElDescriptionsItem label="婚配对象" :span="2">{{ spouseLabel }}</ElDescriptionsItem>
          <ElDescriptionsItem label="所生子女" :span="2">{{ childrenLabel }}</ElDescriptionsItem>
        </template>

        <ElDescriptionsItem label="在世">
          <template v-if="person.isYoushang">
            <ElTag size="small" type="warning" effect="plain">幼殇</ElTag>
          </template>
          <template v-else>{{ person.isAlive === 1 ? '在世' : '已故' }}</template>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出生">{{ person.birthDate || '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="逝世">{{ person.deathDate || '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="籍贯">{{ person.nativePlace || '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="墓葬" :span="2">{{
          person.burialPlace || '—'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="传记" :span="2">{{
          person.biography || '—'
        }}</ElDescriptionsItem>
      </ElDescriptions>
    </template>
    <template #footer>
      <ElButton type="primary" @click="emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { FATHER_REL_TYPES } from '@/mock/relationship'
  import { displayXingdi } from '@/utils/genealogy/xingdi'
  import { isAffinalPerson } from '@/utils/genealogy/person-lineage'

  defineOptions({ name: 'PersonDetailDialog' })

  const props = defineProps<{
    visible: boolean
    person?: Api.Person.Item | null
    persons?: Api.Person.Item[]
    relations?: Api.Relationship.Item[]
  }>()

  const emit = defineEmits<{ 'update:visible': [boolean] }>()

  const genderLabel = (g: Api.Person.Gender) => (g === 1 ? '男' : g === 2 ? '女' : '未知')

  const affinal = computed(() => {
    if (!props.person) return false
    return isAffinalPerson(props.person, props.relations || [])
  })

  const dialogTitle = computed(() => {
    const name = props.person?.nameWei || '人物'
    return `【${name}】详情`
  })

  const nameOf = (id: number) => {
    const hit = (props.persons || []).find((p) => p.id === id)
    return hit?.nameWei || `#${id}`
  }

  const mineRels = computed(() => {
    if (!props.person) return []
    return (props.relations || []).filter((r) => r.fromPersonId === props.person!.id)
  })

  const fatherLabel = computed(() => {
    const mine = mineRels.value
    const bio = mine.find((r) => r.relType === 'father')
    if (bio) return nameOf(bio.toPersonId)
    const other = mine.find((r) => ['sifu', 'jiantiao', 'jifu', 'yifu'].includes(r.relType))
    if (!other) return '—'
    const label =
      other.relType === 'sifu'
        ? '嗣'
        : other.relType === 'jiantiao'
          ? '兼祧'
          : other.relType === 'jifu'
            ? '继'
            : '义'
    return `${nameOf(other.toPersonId)}（${label}）`
  })

  const motherLabel = computed(() => {
    const mother = mineRels.value.find((r) => r.relType === 'mother')
    return mother ? nameOf(mother.toPersonId) : '—'
  })

  const chuChengLabel = computed(() => {
    const parts: string[] = []
    for (const r of mineRels.value) {
      if (r.relType === 'chuji') parts.push(`出继${nameOf(r.toPersonId)}`)
      else if (r.relType === 'sifu') parts.push(`承嗣${nameOf(r.toPersonId)}`)
      else if (r.relType === 'jiantiao') parts.push(`兼祧${nameOf(r.toPersonId)}`)
    }
    return parts.length ? parts.join('；') : '—'
  })

  const decodeSpouseKind = (remark: string | undefined, relType: Api.Relationship.RelType) => {
    if (relType === 'zhuixu') return '赘'
    const raw = (remark || '')
      .replace(/（双向）/gu, '')
      .replace(/\(双向\)/gi, '')
      .trim()
    if (!raw || raw === '双向配偶') return ''
    const kind = raw.split('|')[0]?.trim() || ''
    return kind
  }

  const spousePartners = computed(() => {
    if (!props.person) return []
    const id = props.person.id
    const seen = new Set<number>()
    const rows: { id: number; kind: string }[] = []
    for (const r of props.relations || []) {
      if (r.relType !== 'spouse' && r.relType !== 'zhuixu') continue
      let other = 0
      if (r.fromPersonId === id) other = r.toPersonId
      else if (r.toPersonId === id) other = r.fromPersonId
      else continue
      if (seen.has(other)) continue
      seen.add(other)
      rows.push({ id: other, kind: decodeSpouseKind(r.remark, r.relType) })
    }
    return rows
  })

  const spouseLabel = computed(() => {
    const rows = spousePartners.value
    if (!rows.length) return '—'
    // 姻亲侧：称谓「娶/继娶」记在主系婚配上，此处只写本家对象姓名
    if (affinal.value) {
      return rows
        .map((row) => {
          const p = (props.persons || []).find((item) => item.id === row.id)
          const name = p?.nameWei || `#${row.id}`
          return p ? `${name}（第${p.generation}世）` : name
        })
        .join('、')
    }
    return rows
      .map((row) => {
        const name = nameOf(row.id)
        return row.kind ? `${row.kind} ${name}` : name
      })
      .join('；')
  })

  const xingdiLabel = computed(() => {
    if (!props.person) return '—'
    return displayXingdi(props.person, props.relations || [], props.persons || [])
  })

  /**
   * 子女：关系约定 from=子、to=父/母。
   * 主系：凡指向此人的父系/生母边均计为子女；
   * 姻亲：仅计生母（或父）边指向此人的子女（配偶所生）。
   */
  const childrenLabel = computed(() => {
    if (!props.person) return '—'
    const pid = props.person.id
    const parentTypes = new Set<string>([...FATHER_REL_TYPES, 'mother'])
    const childIds = new Set<number>()
    for (const r of props.relations || []) {
      if (r.toPersonId !== pid || !parentTypes.has(r.relType)) continue
      childIds.add(r.fromPersonId)
    }
    if (!childIds.size) return '—'

    const kids = (props.persons || [])
      .filter((p) => childIds.has(p.id))
      .sort((a, b) => a.generation - b.generation || a.id - b.id)

    if (!kids.length) {
      return [...childIds].map((id) => `#${id}`).join('、')
    }

    return kids
      .map((p) => {
        const sex = p.gender === 1 ? '子' : p.gender === 2 ? '女' : ''
        const xingdi = displayXingdi(p, props.relations || [], props.persons || [])
        const rank = xingdi && xingdi !== '—' ? xingdi : sex
        return rank ? `${p.nameWei}（${rank}）` : p.nameWei
      })
      .join('、')
  })
</script>
