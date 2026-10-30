<!-- 亲属关系 Tab · 配偶按主系合并展示 · §3.4 关系图谱（全局查看/特殊关系；婚配完整建档走人员列表） -->
<template>
  <div class="relation-list-tab h-full flex flex-col min-h-0">
    <ArtTableHeader layout="refresh" :loading="loading" @refresh="load">
      <template #left>
        <ElSpace wrap alignment="flex-end">
          <PageTipIcon
            mode="popover"
            title="人员列表与关系管理如何分工"
            label="说明"
            ariaLabel="关系管理说明"
            :width="420"
            content="婚配完整维护（新建配偶档案、娶/继娶称谓）请在「人员列表 → 编辑人物 → 婚配」操作；此处可全局查看、删除关系，并绑定已有人物的生父/嗣父/兼祧/生母/出继/赘婿等。父子类边统一为「子 → 父/母」，添加时会自动纠正方向。"
          />
          <div>
            <p class="text-xs text-g-500 mb-1">{{ fromFieldLabel }}</p>
            <ElSelect v-model="fromId" filterable class="!w-44" placeholder="选择人物">
              <ElOption v-for="p in persons" :key="p.id" :label="personLabel(p)" :value="p.id" />
            </ElSelect>
          </div>
          <div>
            <p class="text-xs text-g-500 mb-1">关系类型</p>
            <ElSelect v-model="relType" class="!w-36">
              <ElOption
                v-for="(label, key) in addableRelLabels"
                :key="key"
                :label="label"
                :value="key"
              />
            </ElSelect>
          </div>
          <div>
            <p class="text-xs text-g-500 mb-1">{{ toFieldLabel }}</p>
            <ElSelect v-model="toId" filterable class="!w-44" placeholder="选择人物">
              <ElOption v-for="p in persons" :key="p.id" :label="personLabel(p)" :value="p.id" />
            </ElSelect>
          </div>
          <ElInput v-model="remark" class="!w-40" :placeholder="remarkPlaceholder" />
          <ElButton type="primary" v-ripple :disabled="!canWrite" @click="onAdd">
            添加关系
          </ElButton>
        </ElSpace>
      </template>
    </ArtTableHeader>

    <p v-if="isSpouseRelType(relType)" class="text-xs text-g-500 mb-2 shrink-0 px-1">
      配偶仅关联已有人物；新建配偶档案请到人员列表编辑婚配。备注空时将按对象姓名自动生成「配|姓|名」。
    </p>

    <div class="relation-list-tab__table flex-1 min-h-0 overflow-hidden">
      <ElTable v-loading="loading" :data="displayRows" stripe height="100%">
        <ElTableColumn label="主体" min-width="140">
          <template #default="{ row }">{{ nameOf(row.fromPersonId) }}</template>
        </ElTableColumn>
        <ElTableColumn label="关系" width="100">
          <template #default="{ row }">
            {{ relLabels[row.relType as Api.Relationship.RelType] }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="对象" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.toLabel }}</template>
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remarkText || '—' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" label="创建时间" width="160" />
        <ElTableColumn label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <ElButton link type="danger" :disabled="!canWrite" @click="onRemove(row)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchPersonList } from '@/api/person'
  import { fetchCreateRelation, fetchDeleteRelation, fetchRelationList } from '@/api/relationship'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { REL_TYPE_LABELS } from '@/mock/relationship'
  import {
    buildSpouseRemarkFromPerson,
    isParentRelType,
    isSpouseRelType,
    normalizeRelationEndpoints
  } from '@/utils/genealogy/relation-endpoints'

  defineOptions({ name: 'RelationListTab' })

  const props = defineProps<{ genealogyId: number }>()
  const canWrite = computed(() => !useGenealogyStore().isMemberReadOnly)

  /** 列表展示行：普通关系一条一行；配偶按主系合并为一行多任 */
  interface DisplayRow {
    key: string
    fromPersonId: number
    relType: Api.Relationship.RelType
    toLabel: string
    remarkText: string
    createdAt: string
    /** 删除时一并清理的底层关系 id（含双向边） */
    relationIds: number[]
  }

  const loading = ref(false)
  const rawList = ref<Api.Relationship.Item[]>([])
  const persons = ref<Api.Person.Item[]>([])
  const fromId = ref<number>()
  const toId = ref<number>()
  const relType = ref<Api.Relationship.RelType>('father')
  const remark = ref('')
  const relLabels = REL_TYPE_LABELS

  /** 添加区展示全部类型（与产品 §3.4 绑定清单一致）；婚配有旁注引导去人员列表建档 */
  const addableRelLabels = REL_TYPE_LABELS

  const fromFieldLabel = computed(() => {
    if (isParentRelType(relType.value)) return '主体（子）'
    if (isSpouseRelType(relType.value)) return '主体（主系）'
    return '关系主体'
  })
  const toFieldLabel = computed(() => {
    if (isParentRelType(relType.value)) return '对象（父/母）'
    if (isSpouseRelType(relType.value)) return '对象（配偶）'
    return '关系对象'
  })
  const remarkPlaceholder = computed(() =>
    isSpouseRelType(relType.value) ? '配|姓|名（可空）' : '备注'
  )

  const personLabel = (p: Api.Person.Item) => `${p.nameWei}（第${p.generation}世）`
  const nameOf = (id: number) => {
    const p = persons.value.find((x) => x.id === id)
    return p ? personLabel(p) : `#${id}`
  }
  const personOf = (id: number) => persons.value.find((x) => x.id === id)

  const stripNoise = (text: string) =>
    text
      .replace(/（双向）/gu, '')
      .replace(/\(双向\)/gi, '')
      .trim()

  /** 备注 `称谓|姓|名` → 展示用称谓 + 完整讳 */
  const spousePartLabel = (rel: Api.Relationship.Item, spousePersonId: number) => {
    const raw = stripNoise(rel.remark || '')
    const parts = raw.split('|')
    let kind = '配偶'
    let fullName = ''
    if (parts.length >= 3) {
      kind = parts[0] || kind
      const xing = parts[1] || ''
      const ming = parts[2] || ''
      fullName = xing && ming ? `${xing}${ming}` : xing ? `${xing}氏` : ming
    }
    if (!fullName) {
      fullName = stripNoise(personOf(spousePersonId)?.nameWei || `#${spousePersonId}`)
    }
    return `${kind}|${fullName}`
  }

  /**
   * 配偶边展示归并：
   * - 隐藏妻→夫反向行
   * - 同一主系（优先男性）的多任配偶合并为一行，对象列：娶|邹习燕、继娶|龚大珍
   */
  const displayRows = computed<DisplayRow[]>(() => {
    const byId = new Map(persons.value.map((p) => [p.id, p]))
    const spouseRels = rawList.value.filter((r) => r.relType === 'spouse' || r.relType === 'zhuixu')
    const otherRels = rawList.value.filter((r) => r.relType !== 'spouse' && r.relType !== 'zhuixu')

    type PairAcc = {
      holderId: number
      spouseId: number
      primary: Api.Relationship.Item
      allIds: number[]
    }
    const pairMap = new Map<string, PairAcc>()

    for (const r of spouseRels) {
      const a = r.fromPersonId
      const b = r.toPersonId
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      const key = `${lo}-${hi}`
      const pa = byId.get(a)
      const pb = byId.get(b)

      let holderId = a
      let spouseId = b
      if (pa && pb) {
        if (pa.gender === 1 && pb.gender !== 1) {
          holderId = a
          spouseId = b
        } else if (pb.gender === 1 && pa.gender !== 1) {
          holderId = b
          spouseId = a
        }
      }

      const prev = pairMap.get(key)
      if (!prev) {
        const preferred =
          spouseRels.find(
            (x) =>
              x.fromPersonId === holderId &&
              x.toPersonId === spouseId &&
              (x.relType === 'spouse' || x.relType === 'zhuixu')
          ) || r
        pairMap.set(key, {
          holderId,
          spouseId,
          primary: preferred,
          allIds: [r.id]
        })
      } else {
        if (!prev.allIds.includes(r.id)) prev.allIds.push(r.id)
        if (r.fromPersonId === prev.holderId && r.toPersonId === prev.spouseId) {
          prev.primary = r
        }
      }
    }

    const byHolder = new Map<
      number,
      { parts: string[]; ids: number[]; createdAt: string; relType: Api.Relationship.RelType }
    >()
    for (const acc of pairMap.values()) {
      const part = spousePartLabel(acc.primary, acc.spouseId)
      const cur = byHolder.get(acc.holderId)
      if (!cur) {
        byHolder.set(acc.holderId, {
          parts: [part],
          ids: [...acc.allIds],
          createdAt: acc.primary.createdAt,
          relType: acc.primary.relType
        })
      } else {
        if (!cur.parts.includes(part)) cur.parts.push(part)
        for (const id of acc.allIds) {
          if (!cur.ids.includes(id)) cur.ids.push(id)
        }
        if (acc.primary.createdAt > cur.createdAt) cur.createdAt = acc.primary.createdAt
      }
    }

    const spouseRows: DisplayRow[] = [...byHolder.entries()].map(([holderId, g]) => ({
      key: `spouse-${holderId}`,
      fromPersonId: holderId,
      relType: g.relType === 'zhuixu' ? 'zhuixu' : 'spouse',
      toLabel: g.parts.join('、'),
      remarkText: '',
      createdAt: g.createdAt,
      relationIds: g.ids
    }))

    const normalRows: DisplayRow[] = otherRels.map((r) => ({
      key: `rel-${r.id}`,
      fromPersonId: r.fromPersonId,
      relType: r.relType,
      toLabel: nameOf(r.toPersonId),
      remarkText: stripNoise(r.remark || ''),
      createdAt: r.createdAt,
      relationIds: [r.id]
    }))

    return [...spouseRows, ...normalRows].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
    )
  })

  const load = async () => {
    loading.value = true
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
      rawList.value = rels
      persons.value = personRes.records
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const onAdd = async () => {
    if (!canWrite.value) {
      ElMessage.warning('族谱成员为只读，无法添加关系')
      return
    }
    if (!fromId.value || !toId.value) {
      ElMessage.warning('请选择主体与对象')
      return
    }
    try {
      const normalized = normalizeRelationEndpoints(
        fromId.value,
        toId.value,
        relType.value,
        persons.value
      )
      let finalRemark = remark.value.trim()
      if (isSpouseRelType(relType.value) && !finalRemark) {
        finalRemark = buildSpouseRemarkFromPerson(personOf(normalized.toPersonId))
      }
      await fetchCreateRelation({
        genealogyId: props.genealogyId,
        fromPersonId: normalized.fromPersonId,
        toPersonId: normalized.toPersonId,
        relType: relType.value,
        remark: finalRemark
      })
      if (normalized.swapped && normalized.tip) {
        ElMessage.success(`已添加（${normalized.tip}）`)
      } else {
        ElMessage.success('已添加')
      }
      fromId.value = normalized.fromPersonId
      toId.value = normalized.toPersonId
      remark.value = ''
      load()
    } catch (e: any) {
      ElMessage.error(e?.message || '添加失败')
    }
  }

  const onRemove = async (row: DisplayRow) => {
    if (!canWrite.value) {
      ElMessage.warning('族谱成员为只读，无法删除关系')
      return
    }
    try {
      const isSpouse = isSpouseRelType(row.relType)
      const tip = isSpouse
        ? row.relationIds.length > 1
          ? `确定删除该配偶关系？将清除 ${row.relationIds.length} 条双向记录。配偶人物档案仍保留，可在人员列表核对婚配。`
          : '确定删除该配偶关系？配偶人物档案仍保留，可在人员列表核对婚配。'
        : '确定删除该关系？'
      await ElMessageBox.confirm(tip, '提示', { type: 'warning' })
      for (const id of row.relationIds) {
        await fetchDeleteRelation(id)
      }
      ElMessage.success('已删除')
      load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }

  watch(
    () => props.genealogyId,
    async (id) => {
      if (!id) return
      try {
        await useGenealogyStore().refreshFromServer(id)
      } catch {
        // ignore
      }
      await load()
    },
    { immediate: true }
  )
</script>
