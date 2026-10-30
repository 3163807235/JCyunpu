<!-- 资料档案 · v3.1.6 §3.4 页面 11 / §1.7.14；K1+K2 -->
<template>
  <div class="genealogy-archives art-full-height">
    <p class="mb-3 text-xs text-g-500 shrink-0">
      存储 {{ storageUsedMb.toFixed(2) }} / {{ storageLimitMb }} MB · 单文件上限
      {{ formatFileSize(MAX_ATTACHMENT_BYTES) }}
    </p>

    <ElAlert
      v-if="expired"
      class="mb-3! shrink-0"
      type="error"
      :closable="false"
      title="订阅已过期：仅可浏览，不可上传或删除。请续费后恢复。"
    />
    <ElAlert
      v-else-if="storageFull"
      class="mb-3! shrink-0"
      type="warning"
      :closable="false"
      title="存储额度已用尽：已禁用上传，仍可浏览与删除。请扩容或清理回收站。"
    />

    <ArtSearchBar
      v-model="searchForm"
      class="shrink-0"
      :items="searchItems"
      @search="onSearch"
      @reset="onReset"
    />

    <ElCard class="art-table-card mt-3" shadow="never">
      <ArtTableHeader layout="refresh" :loading="loading" @refresh="load">
        <template #left>
          <ElSpace wrap>
            <ElButton :disabled="!canUpload" type="primary" v-ripple @click="openUpload">
              <ArtSvgIcon icon="ri:upload-2-line" class="mr-1" />
              上传附件
            </ElButton>
            <ElButton @click="trashVisible = true">
              <ArtSvgIcon icon="ri:delete-bin-line" class="mr-1" />
              回收站
            </ElButton>
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              @change="onFilePicked"
            />
          </ElSpace>
        </template>
      </ArtTableHeader>
      <ArtTable
        :loading="loading"
        :data="records"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="onSizeChange"
        @pagination:current-change="onPageChange"
      />
    </ElCard>

    <!-- 上传：选类型后选文件 -->
    <ElDialog v-model="uploadVisible" title="上传附件" width="480px" align-center destroy-on-close>
      <ElForm label-position="top">
        <ElFormItem label="附件分类" required>
          <ElSelect v-model="uploadType" class="w-full" placeholder="选择分类">
            <ElOption
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="选择文件">
          <ElButton @click="fileInputRef?.click()">
            <ArtSvgIcon icon="ri:folder-open-line" class="mr-1" />
            {{ pendingFileName || '浏览本地文件' }}
          </ElButton>
          <p class="mt-2 text-xs text-g-500">
            支持图片 / PDF / 办公文档；单文件 ≤
            {{ formatFileSize(MAX_ATTACHMENT_BYTES) }}；图片自动生成缩略图。
          </p>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="uploadVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          :loading="uploading"
          :disabled="!pendingFile"
          v-ripple
          @click="confirmUpload"
        >
          开始上传
        </ElButton>
      </template>
    </ElDialog>

    <!-- 预览 -->
    <ElDialog v-model="previewVisible" title="预览" width="720px" align-center destroy-on-close>
      <template v-if="previewItem">
        <div class="mb-3 text-sm text-g-600">
          {{ previewItem.fileName }} · {{ formatFileSize(previewItem.fileSize) }}
        </div>
        <div class="flex-cc min-h-48 bg-g-100 rounded-md p-4">
          <img
            v-if="previewSrc && previewItem.fileType === 'image'"
            :src="previewSrc"
            alt="预览"
            class="max-h-96 max-w-full object-contain"
          />
          <div v-else class="text-center text-g-500">
            <ArtSvgIcon icon="ri:file-text-line" class="text-4xl mb-2" />
            <p>该类型暂不支持内嵌预览，请下载查看</p>
            <p v-if="!previewSrc" class="text-xs mt-1">（大文件 Mock 未持久化完整内容）</p>
          </div>
        </div>
      </template>
      <template #footer>
        <ElButton @click="previewVisible = false">关闭</ElButton>
        <ElButton type="primary" :disabled="!previewSrc" @click="downloadItem(previewItem)">
          下载
        </ElButton>
      </template>
    </ElDialog>

    <!-- 回收站 -->
    <ElDrawer v-model="trashVisible" title="附件回收站" size="520px" destroy-on-close>
      <p class="text-xs text-g-500 mb-3">回收站内附件仍占用存储额度；彻底删除后释放。</p>
      <ArtTable :loading="trashLoading" :data="trashRecords" :columns="trashColumns" />
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { useRoute } from 'vue-router'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    fetchAttachmentList,
    fetchPurgeAttachment,
    fetchRestoreAttachment,
    fetchSoftDeleteAttachment,
    fetchUploadAttachment,
    formatFileSize,
    MAX_ATTACHMENT_BYTES
  } from '@/api/attachment'
  import { useUserStore } from '@/store/modules/user'
  import { useGenealogyStore } from '@/store/modules/genealogy'
  import { useGenealogyContext } from '@/hooks/core/useGenealogyContext'
  import { useSubscriptionGuard } from '@/hooks/core/useSubscriptionGuard'

  defineOptions({ name: 'GenealogyArchives' })

  useGenealogyContext()

  const route = useRoute()
  const userStore = useUserStore()
  const genealogyStore = useGenealogyStore()
  const { summary, expired, canWrite, refresh: refreshSub } = useSubscriptionGuard()

  const genealogyId = computed(() => Number(route.params.id))
  const storageUsedMb = computed(() => summary.value?.storageUsedMb ?? 0)
  const storageLimitMb = computed(() => summary.value?.storageLimitMb ?? 0)
  const storageFull = computed(
    () => storageUsedMb.value >= storageLimitMb.value && storageLimitMb.value > 0
  )
  const canUpload = computed(() => canWrite.value && !storageFull.value)

  const loading = ref(false)
  const uploading = ref(false)
  const records = ref<Api.Attachment.Item[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })

  const uploadVisible = ref(false)
  const uploadType = ref<Api.Attachment.AttachmentType>('person_photo')
  const fileInputRef = ref<HTMLInputElement>()
  const pendingFile = ref<File | null>(null)
  const pendingFileName = computed(() => pendingFile.value?.name || '')

  const previewVisible = ref(false)
  const previewItem = ref<Api.Attachment.Item | null>(null)
  const previewSrc = computed(
    () => previewItem.value?.contentDataUrl || previewItem.value?.thumbnailPath || ''
  )

  const trashVisible = ref(false)
  const trashLoading = ref(false)
  const trashRecords = ref<Api.Attachment.Item[]>([])

  const typeOptions: { label: string; value: Api.Attachment.AttachmentType }[] = [
    { label: '人物照片', value: 'person_photo' },
    { label: '老谱扫描件', value: 'old_scan' },
    { label: '碑拓', value: 'tablet' },
    { label: '茔图', value: 'tomb_map' },
    { label: '文档', value: 'document' },
    { label: '其他', value: 'other' }
  ]

  const typeLabel = (t: Api.Attachment.AttachmentType) =>
    typeOptions.find((o) => o.value === t)?.label || t

  const searchForm = reactive({
    keyword: '',
    attachmentType: '' as Api.Attachment.AttachmentType | '',
    fileType: '' as Api.Attachment.FileType | ''
  })

  const searchItems = computed(() => [
    {
      label: '文件名',
      key: 'keyword',
      type: 'input' as const,
      placeholder: '搜索文件名',
      clearable: true
    },
    {
      label: '分类',
      key: 'attachmentType',
      type: 'select' as const,
      props: {
        clearable: true,
        placeholder: '全部分类',
        options: typeOptions.map((o) => ({ label: o.label, value: o.value }))
      }
    },
    {
      label: '文件类型',
      key: 'fileType',
      type: 'select' as const,
      props: {
        clearable: true,
        placeholder: '全部类型',
        options: [
          { label: '图片', value: 'image' },
          { label: 'PDF', value: 'pdf' },
          { label: '文档', value: 'doc' },
          { label: '扫描件', value: 'scan' },
          { label: '其他', value: 'other' }
        ]
      }
    }
  ])

  const columns = computed(() => [
    {
      prop: 'thumb',
      label: '缩略图',
      width: 88,
      formatter: (row: Api.Attachment.Item) =>
        row.thumbnailPath || (row.fileType === 'image' && row.contentDataUrl)
          ? h('img', {
              src: row.thumbnailPath || row.contentDataUrl,
              class: 'w-12 h-12 object-cover rounded',
              alt: ''
            })
          : h(ArtSvgIcon, { icon: 'ri:file-line', class: 'text-2xl text-g-400' })
    },
    {
      prop: 'fileName',
      label: '文件名',
      minWidth: 180,
      formatter: (row: Api.Attachment.Item) => row.fileName
    },
    {
      prop: 'attachmentType',
      label: '分类',
      width: 110,
      formatter: (row: Api.Attachment.Item) =>
        h(ElTag, { size: 'small', type: 'info' }, () => typeLabel(row.attachmentType))
    },
    {
      prop: 'fileSize',
      label: '大小',
      width: 100,
      formatter: (row: Api.Attachment.Item) => formatFileSize(row.fileSize)
    },
    {
      prop: 'uploaderName',
      label: '上传人',
      width: 110,
      formatter: (row: Api.Attachment.Item) => row.uploaderName || '—'
    },
    {
      prop: 'createdAt',
      label: '上传时间',
      width: 170,
      formatter: (row: Api.Attachment.Item) => row.createdAt
    },
    {
      prop: 'ops',
      label: '操作',
      width: 180,
      fixed: 'right',
      formatter: (row: Api.Attachment.Item) =>
        h('div', { class: 'flex gap-1 flex-wrap' }, [
          h(
            ElButton,
            { link: true, type: 'primary', onClick: () => openPreview(row) },
            () => '预览'
          ),
          h(
            ElButton,
            {
              link: true,
              type: 'primary',
              disabled: !(row.contentDataUrl || row.thumbnailPath),
              onClick: () => downloadItem(row)
            },
            () => '下载'
          ),
          h(
            ElButton,
            {
              link: true,
              type: 'danger',
              disabled: !canWrite.value,
              onClick: () => removeItem(row)
            },
            () => '删除'
          )
        ])
    }
  ])

  const trashColumns = computed(() => [
    {
      prop: 'fileName',
      label: '文件名',
      minWidth: 140,
      formatter: (row: Api.Attachment.Item) => row.fileName
    },
    {
      prop: 'fileSize',
      label: '大小',
      width: 90,
      formatter: (row: Api.Attachment.Item) => formatFileSize(row.fileSize)
    },
    {
      prop: 'deletedAt',
      label: '删除时间',
      width: 160,
      formatter: (row: Api.Attachment.Item) => row.deletedAt || '—'
    },
    {
      prop: 'ops',
      label: '操作',
      width: 140,
      formatter: (row: Api.Attachment.Item) =>
        h('div', { class: 'flex gap-1' }, [
          h(
            ElButton,
            {
              link: true,
              type: 'primary',
              disabled: !canWrite.value,
              onClick: () => restoreItem(row)
            },
            () => '恢复'
          ),
          h(
            ElButton,
            {
              link: true,
              type: 'danger',
              disabled: !canWrite.value,
              onClick: () => purgeItem(row)
            },
            () => '彻底删除'
          )
        ])
    }
  ])

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsDataURL(file)
    })

  const makeThumbnail = (file: File): Promise<string | undefined> =>
    new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(undefined)
        return
      }
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const max = 160
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.72))
        } catch {
          resolve(undefined)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(undefined)
      }
      img.src = url
    })

  const load = async () => {
    if (!genealogyId.value) return
    loading.value = true
    try {
      await refreshSub()
      const res = await fetchAttachmentList({
        genealogyId: genealogyId.value,
        current: pagination.current,
        size: pagination.size,
        keyword: searchForm.keyword || undefined,
        attachmentType: searchForm.attachmentType || undefined,
        fileType: searchForm.fileType || undefined,
        scope: 'active'
      })
      records.value = res.records
      pagination.total = res.total
      pagination.current = res.current
      pagination.size = res.size
    } catch (e: any) {
      ElMessage.error(e?.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const loadTrash = async () => {
    if (!genealogyId.value) return
    trashLoading.value = true
    try {
      const res = await fetchAttachmentList({
        genealogyId: genealogyId.value,
        current: 1,
        size: 100,
        scope: 'trash'
      })
      trashRecords.value = res.records
    } catch (e: any) {
      ElMessage.error(e?.message || '加载回收站失败')
    } finally {
      trashLoading.value = false
    }
  }

  const onSearch = () => {
    pagination.current = 1
    load()
  }

  const onReset = () => {
    searchForm.keyword = ''
    searchForm.attachmentType = ''
    searchForm.fileType = ''
    pagination.current = 1
    load()
  }

  const onSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    load()
  }

  const onPageChange = (page: number) => {
    pagination.current = page
    load()
  }

  const openUpload = () => {
    if (!canUpload.value) {
      ElMessage.warning(expired.value ? '订阅已过期' : '存储额度已用尽')
      return
    }
    pendingFile.value = null
    uploadVisible.value = true
  }

  const onFilePicked = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (file.size > MAX_ATTACHMENT_BYTES) {
      ElMessage.error(`单文件不能超过 ${formatFileSize(MAX_ATTACHMENT_BYTES)}`)
      return
    }
    pendingFile.value = file
    if (!uploadVisible.value) uploadVisible.value = true
  }

  const confirmUpload = async () => {
    const file = pendingFile.value
    if (!file || !genealogyId.value) return
    uploading.value = true
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() || '' : ''
      const [contentDataUrl, thumbnailPath] = await Promise.all([
        readAsDataUrl(file),
        makeThumbnail(file)
      ])
      const info = userStore.getUserInfo
      await fetchUploadAttachment(
        {
          genealogyId: genealogyId.value,
          attachmentType: uploadType.value,
          fileName: file.name,
          fileExt: ext,
          fileSize: file.size,
          mimeType: file.type,
          contentDataUrl,
          thumbnailPath
        },
        {
          userId: Number(info.userId) || 10001,
          name: info.nickName || info.userName || '当前用户'
        }
      )
      ElMessage.success('上传成功')
      uploadVisible.value = false
      pendingFile.value = null
      await genealogyStore.refreshFromServer(genealogyId.value)
      await refreshSub()
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '上传失败')
    } finally {
      uploading.value = false
    }
  }

  const openPreview = (row: Api.Attachment.Item) => {
    previewItem.value = row
    previewVisible.value = true
  }

  const downloadItem = (row: Api.Attachment.Item | null) => {
    if (!row) return
    const src = row.contentDataUrl || row.thumbnailPath
    if (!src) {
      ElMessage.warning('当前 Mock 未保存完整文件内容，无法下载')
      return
    }
    const a = document.createElement('a')
    a.href = src
    a.download = row.fileName
    a.click()
  }

  const removeItem = async (row: Api.Attachment.Item) => {
    try {
      await ElMessageBox.confirm(`确定将「${row.fileName}」移入回收站？`, '删除附件', {
        type: 'warning'
      })
      await fetchSoftDeleteAttachment(row.id)
      ElMessage.success('已移入回收站（仍占用存储额度）')
      await genealogyStore.refreshFromServer(genealogyId.value)
      await load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '删除失败')
    }
  }

  const restoreItem = async (row: Api.Attachment.Item) => {
    try {
      await fetchRestoreAttachment(row.id)
      ElMessage.success('已恢复')
      await genealogyStore.refreshFromServer(genealogyId.value)
      await loadTrash()
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '恢复失败')
    }
  }

  const purgeItem = async (row: Api.Attachment.Item) => {
    try {
      await ElMessageBox.confirm(
        `彻底删除「${row.fileName}」后不可恢复，并将释放存储额度。是否继续？`,
        '彻底删除',
        { type: 'warning', confirmButtonText: '彻底删除' }
      )
      await fetchPurgeAttachment(row.id)
      ElMessage.success('已彻底删除并释放额度')
      await refreshSub()
      await loadTrash()
      await load()
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      ElMessage.error(e?.message || '操作失败')
    }
  }

  watch(genealogyId, load, { immediate: true })
  watch(trashVisible, (v) => {
    if (v) loadTrash()
  })
</script>
