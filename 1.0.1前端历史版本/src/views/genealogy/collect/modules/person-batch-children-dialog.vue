<!-- 批量添加子女 · 相对当前人一次录入多名子女 · §3.4 人员列表 -->
<template>
  <ElDialog
    :model-value="visible"
    :title="dialogTitle"
    width="780px"
    align-center
    destroy-on-close
    append-to-body
    @close="emit('update:visible', false)"
  >
    <p class="text-xs text-g-500 mb-3">
      子女默认归属第
      {{ childGeneration }} 世；姓默认带入本族姓，可按行修改。额度不足时将中止后续录入。
    </p>

    <div class="flex flex-col gap-3">
      <div
        v-for="(row, index) in rows"
        :key="row.key"
        class="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-g-200/40"
      >
        <div class="w-20">
          <p class="text-xs text-g-500 mb-1">姓</p>
          <ElInput v-model="row.xing" maxlength="8" placeholder="姓" />
        </div>
        <div class="w-28">
          <p class="text-xs text-g-500 mb-1">名 <span class="text-danger">*</span></p>
          <ElInput v-model="row.ming" maxlength="32" placeholder="讳" />
        </div>
        <div class="w-28">
          <p class="text-xs text-g-500 mb-1">性别</p>
          <ElSelect v-model="row.gender" class="w-full">
            <ElOption :value="1" label="男" />
            <ElOption :value="2" label="女" />
            <ElOption :value="0" label="未知" />
          </ElSelect>
        </div>
        <div class="w-28">
          <p class="text-xs text-g-500 mb-1">排行</p>
          <ElSelect v-model="row.xingdi" clearable class="w-full" placeholder="数字">
            <ElOption
              v-for="opt in xingdiOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </ElSelect>
        </div>
        <div class="w-36">
          <p class="text-xs text-g-500 mb-1">出生</p>
          <ElInput v-model="row.birthDate" placeholder="选填" />
        </div>
        <ElButton
          link
          type="danger"
          :disabled="rows.length <= 1"
          class="!mb-0.5"
          @click="removeRow(index)"
        >
          <ArtSvgIcon icon="ri:delete-bin-line" class="text-base" />
        </ElButton>
      </div>
    </div>

    <ElButton class="mt-3" plain @click="addRow">
      <ArtSvgIcon icon="ri:add-line" class="mr-1" />
      再加一行
    </ElButton>

    <template #footer>
      <ElButton @click="emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" v-ripple @click="submit">
        保存（{{ validRowCount }} 人）
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchCreatePerson } from '@/api/person'
  import { fetchCreateRelation } from '@/api/relationship'
  import { fetchSubscriptionSummary } from '@/api/genealogy'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { XINGDI_RANK_OPTIONS } from '@/utils/genealogy/xingdi'

  defineOptions({ name: 'PersonBatchChildrenDialog' })

  interface ChildRow {
    key: number
    xing: string
    ming: string
    gender: Api.Person.Gender
    xingdi: string
    birthDate: string
  }

  const props = defineProps<{
    visible: boolean
    genealogyId: number
    parent: Api.Person.Item | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  const genealogyStore = useGenealogyStore()
  const submitting = ref(false)
  const xingdiOptions = XINGDI_RANK_OPTIONS
  let rowKey = 1
  const rows = ref<ChildRow[]>([])

  const clanSurname = computed(
    () => genealogyStore.current?.surname?.trim() || props.parent?.nameWei?.slice(0, 1) || ''
  )

  const childGeneration = computed(() => Math.min(99, (props.parent?.generation || 1) + 1))

  const dialogTitle = computed(() =>
    props.parent ? `为「${props.parent.nameWei}」批量添加子女` : '批量添加子女'
  )

  const validRowCount = computed(() => rows.value.filter((r) => r.ming.trim()).length)

  const makeRow = (xingdi = '1'): ChildRow => ({
    key: rowKey++,
    xing: clanSurname.value,
    ming: '',
    gender: 1,
    xingdi,
    birthDate: ''
  })

  const addRow = () => {
    const sameGender = rows.value.filter((r) => r.gender === 1)
    const next = String(Math.min(12, sameGender.length + 1))
    rows.value.push(makeRow(next))
  }

  const removeRow = (index: number) => {
    if (rows.value.length <= 1) return
    rows.value.splice(index, 1)
  }

  const resetRows = () => {
    rows.value = [makeRow('1'), makeRow('2')]
  }

  watch(
    () => props.visible,
    (v) => {
      if (v) resetRows()
    }
  )

  const submit = async () => {
    if (!props.parent) return
    const targets = rows.value.filter((r) => r.ming.trim())
    if (!targets.length) {
      ElMessage.warning('请至少填写一名子女的名（讳）')
      return
    }

    submitting.value = true
    let success = 0
    try {
      const summary = await fetchSubscriptionSummary()
      let remain = Math.max(0, summary.personLimit - summary.personUsed)
      const parentType: Api.Relationship.RelType = props.parent.gender === 2 ? 'mother' : 'father'

      for (const row of targets) {
        if (remain <= 0) {
          ElMessage.warning(`额度不足，已成功添加 ${success} 人，其余未录入`)
          break
        }
        const nameWei = `${row.xing.trim()}${row.ming.trim()}`
        const created = await fetchCreatePerson(
          props.genealogyId,
          {
            nameWei,
            nameZi: '',
            nameHao: '',
            xingdi: row.xingdi.trim(),
            zibei: '',
            generation: childGeneration.value,
            gender: row.gender,
            birthDate: row.birthDate.trim(),
            deathDate: '',
            isAlive: 1,
            nativePlace: '',
            burialPlace: '',
            biography: '',
            privacyLevel: 2
          },
          summary.personLimit
        )
        await fetchCreateRelation({
          genealogyId: props.genealogyId,
          fromPersonId: created.id,
          toPersonId: props.parent.id,
          relType: parentType,
          remark: '批量添加子女'
        })
        success += 1
        remain -= 1
      }

      if (success > 0) {
        ElMessage.success(`已添加 ${success} 名子女`)
        emit('success')
        emit('update:visible', false)
      }
    } catch (e: any) {
      if (success > 0) {
        ElMessage.warning(`已添加 ${success} 人后中断：${e?.message || '保存失败'}`)
        emit('success')
      } else {
        ElMessage.error(e?.message || '批量添加失败')
      }
    } finally {
      submitting.value = false
    }
  }
</script>
