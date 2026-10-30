<!-- 人物批量导入 · 居中弹窗 · §1.10.1 下载模板→上传→校验反馈 -->
<template>
  <ElDialog
    :model-value="visible"
    title="批量导入人物"
    width="640px"
    align-center
    destroy-on-close
    append-to-body
    :close-on-click-modal="phase !== 'importing'"
    :close-on-press-escape="phase !== 'importing'"
    @close="onClose"
  >
    <!-- 选择文件 -->
    <template v-if="phase === 'idle' || phase === 'error'">
      <p class="text-xs text-g-500 mb-3">
        请使用标准模板：橙色表头为必填、浅蓝为选填；第 2 行黄底为填写说明（勿填正式数据），请从第 3
        行起录入。悬停列头可看批注。单次最多 1000 行。
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <ElButton @click="onDownloadTemplate">
          <ArtSvgIcon icon="ri:download-2-line" class="mr-1" />
          下载导入模板
        </ElButton>
      </div>

      <div
        class="import-dropzone rounded-lg border border-dashed border-g-300 px-4 py-8 text-center cursor-pointer transition-colors"
        :class="{ 'is-dragover': dragOver }"
        @click="fileRef?.click()"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <ArtSvgIcon icon="ri:file-excel-2-line" class="text-3xl text-g-400 mb-2 inline-block" />
        <p class="text-sm text-g-700 mb-1">
          {{ selectedFile ? selectedFile.name : '点击选择或拖拽 Excel 到此处' }}
        </p>
        <p class="text-xs text-g-500">支持 .xlsx / .xls</p>
      </div>
      <input ref="fileRef" type="file" accept=".xlsx,.xls" class="hidden" @change="onFilePick" />

      <ElAlert
        v-if="fatalMessage"
        class="mt-4!"
        type="error"
        :closable="false"
        :title="fatalMessage"
      />

      <div v-if="issueLines.length" class="mt-4">
        <p class="text-sm font-medium mb-2">校验问题（{{ issueLines.length }}）</p>
        <ul class="issue-list rounded-lg bg-g-200/40 px-3 py-2 text-xs text-g-700">
          <li v-for="(line, i) in issueLines" :key="i" class="py-1 leading-relaxed">
            {{ line.message }}
          </li>
        </ul>
      </div>
    </template>

    <!-- 导入中 -->
    <template v-else-if="phase === 'importing'">
      <div class="py-8 text-center">
        <ArtSvgIcon
          icon="ri:loader-4-line"
          class="text-3xl text-primary animate-spin inline-block"
        />
        <p class="mt-3 text-sm text-g-700">正在导入 {{ pendingCount }} 人，请稍候…</p>
        <p class="mt-1 text-xs text-g-500">导入完成前请勿关闭此窗口</p>
      </div>
    </template>

    <!-- 完成 -->
    <template v-else-if="phase === 'done'">
      <div class="flex flex-wrap gap-3 mb-4">
        <div class="stat-chip success">
          <span class="label">成功</span>
          <span class="value">{{ summary.success }}</span>
        </div>
        <div class="stat-chip danger">
          <span class="label">失败</span>
          <span class="value">{{ summary.failed }}</span>
        </div>
        <div class="stat-chip warn">
          <span class="label">解析跳过</span>
          <span class="value">{{ summary.skipped }}</span>
        </div>
      </div>

      <ElAlert
        :type="summary.failed || summary.skipped ? 'warning' : 'success'"
        :closable="false"
        :title="doneTitle"
      />

      <div v-if="issueLines.length" class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium">明细（{{ issueLines.length }}）</p>
          <ElButton link type="primary" @click="onDownloadReport">
            <ArtSvgIcon icon="ri:file-download-line" class="mr-1" />
            下载校验报告
          </ElButton>
        </div>
        <ul class="issue-list rounded-lg bg-g-200/40 px-3 py-2 text-xs text-g-700">
          <li v-for="(line, i) in issueLines" :key="i" class="py-1 leading-relaxed">
            <ElTag
              size="small"
              :type="
                line.status === '成功' ? 'success' : line.status === '存疑' ? 'warning' : 'danger'
              "
              class="mr-2 align-middle"
            >
              {{ line.status }}
            </ElTag>
            <span class="align-middle">{{ line.message }}</span>
          </li>
        </ul>
      </div>
      <div v-else class="mt-4 flex justify-end">
        <ElButton link type="primary" @click="onDownloadReport">
          <ArtSvgIcon icon="ri:file-download-line" class="mr-1" />
          下载校验报告
        </ElButton>
      </div>
    </template>

    <template #footer>
      <template v-if="phase === 'idle' || phase === 'error'">
        <ElButton @click="onClose">取消</ElButton>
        <ElButton type="primary" :disabled="!selectedFile" v-ripple @click="startImport">
          开始导入
        </ElButton>
      </template>
      <template v-else-if="phase === 'importing'">
        <ElButton disabled>导入中…</ElButton>
      </template>
      <template v-else>
        <ElButton @click="resetToIdle">继续导入</ElButton>
        <ElButton type="primary" v-ripple @click="onClose">完成</ElButton>
      </template>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchImportPersons } from '@/api/person'
  import {
    downloadPersonImportReport,
    downloadPersonImportTemplate,
    parsePersonImportWorkbook,
    type PersonImportReportLine
  } from '@/utils/genealogy/person-import'

  defineOptions({ name: 'PersonImportDialog' })

  const props = defineProps<{
    visible: boolean
    genealogyId: number
    personLimit: number
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  type Phase = 'idle' | 'error' | 'importing' | 'done'

  const phase = ref<Phase>('idle')
  const dragOver = ref(false)
  const fileRef = ref<HTMLInputElement | null>(null)
  const selectedFile = ref<File | null>(null)
  const fatalMessage = ref('')
  const issueLines = ref<PersonImportReportLine[]>([])
  const pendingCount = ref(0)
  const summary = ref({ success: 0, failed: 0, skipped: 0 })
  const importedOk = ref(false)

  const doneTitle = computed(() => {
    const { success, failed, skipped } = summary.value
    if (!failed && !skipped) return `全部导入成功，共 ${success} 人`
    return `成功 ${success} 人，失败 ${failed} 人，解析跳过 ${skipped} 行`
  })

  const resetState = () => {
    phase.value = 'idle'
    dragOver.value = false
    selectedFile.value = null
    fatalMessage.value = ''
    issueLines.value = []
    pendingCount.value = 0
    summary.value = { success: 0, failed: 0, skipped: 0 }
    importedOk.value = false
    if (fileRef.value) fileRef.value.value = ''
  }

  const resetToIdle = () => {
    resetState()
  }

  watch(
    () => props.visible,
    (v) => {
      if (v) resetState()
    }
  )

  const onClose = () => {
    if (phase.value === 'importing') return
    const shouldRefresh = importedOk.value
    emit('update:visible', false)
    if (shouldRefresh) emit('success')
  }

  const onDownloadTemplate = () => {
    downloadPersonImportTemplate()
  }

  const onDownloadReport = () => {
    downloadPersonImportReport(issueLines.value, summary.value)
  }

  const acceptFile = (file: File | undefined | null) => {
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      fatalMessage.value = '请选择 .xlsx 或 .xls 格式的模板文件'
      phase.value = 'error'
      selectedFile.value = null
      return
    }
    selectedFile.value = file
    fatalMessage.value = ''
    issueLines.value = []
    phase.value = 'idle'
  }

  const onFilePick = (e: Event) => {
    const input = e.target as HTMLInputElement
    acceptFile(input.files?.[0])
  }

  const onDrop = (e: DragEvent) => {
    dragOver.value = false
    acceptFile(e.dataTransfer?.files?.[0])
  }

  const startImport = async () => {
    const file = selectedFile.value
    if (!file) return

    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const parsed = parsePersonImportWorkbook(wb)

      if (parsed.fatalErrors.length) {
        fatalMessage.value = parsed.fatalErrors[0]
        issueLines.value = parsed.fatalErrors.slice(1).map((m) => ({
          status: '错误' as const,
          message: m
        }))
        phase.value = 'error'
        return
      }

      if (!parsed.rows.length) {
        fatalMessage.value = parsed.rowErrors[0] || '无有效数据行'
        issueLines.value = parsed.rowErrors.slice(1).map((m) => ({
          status: '错误' as const,
          message: m
        }))
        phase.value = 'error'
        return
      }

      const parseIssues: PersonImportReportLine[] = parsed.rowErrors.map((m) => ({
        status: '错误',
        message: m
      }))

      pendingCount.value = parsed.rows.length
      phase.value = 'importing'

      const payload: Api.Person.ImportRow[] = parsed.rows.map((r) => ({
        personNo: r.personNo,
        form: r.form,
        fatherNo: r.fatherNo,
        motherNo: r.motherNo,
        spouseNos: r.spouseNos
      }))

      const result = await fetchImportPersons(props.genealogyId, payload, props.personLimit)

      summary.value = {
        success: result.success,
        failed: result.failed,
        skipped: parsed.rowErrors.length
      }
      issueLines.value = [
        ...parseIssues,
        ...result.errors.map((m) => ({ status: '错误' as const, message: m }))
      ]
      importedOk.value = result.success > 0
      phase.value = 'done'
    } catch (err: any) {
      fatalMessage.value = err?.message || '导入失败'
      issueLines.value = []
      phase.value = 'error'
    }
  }
</script>

<style scoped lang="scss">
  .import-dropzone {
    &:hover,
    &.is-dragover {
      border-color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
    }
  }

  .issue-list {
    max-height: 220px;
    overflow-y: auto;
  }

  .stat-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 8px;
    background: rgb(var(--art-gray-200-rgb, 243 244 246) / 0.6);

    .label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .value {
      font-size: 20px;
      font-weight: 600;
      line-height: 1;
    }

    &.success .value {
      color: var(--el-color-success);
    }

    &.danger .value {
      color: var(--el-color-danger);
    }

    &.warn .value {
      color: var(--el-color-warning);
    }
  }
</style>
