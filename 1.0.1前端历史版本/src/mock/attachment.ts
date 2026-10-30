/**
 * 附件 / 资料档案 Mock（localStorage）
 * 依据：v3.1.6 §1.7.14、§3.4 页面 11；回收站占用存储额度
 * K2：单文件 ≤ 10MB；图片生成缩略图
 */

import {
  applyStorageUsageDelta,
  assertStorageQuotaAvailable,
  assertSubscriptionWritable,
  setStorageUsedMb
} from './subscription'
import { appendOperationLog } from './operation-log'

const STORAGE_KEY = 'jcyunpu_mock_attachments'
/** 单文件上限 10MB（计划 K2 / 上传拦截） */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
/** 完整内容落盘上限，超出仅保留元数据+缩略图 */
const PERSIST_CONTENT_MAX = 1024 * 1024

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readAll(): Api.Attachment.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Api.Attachment.Item[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Api.Attachment.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId(list: Api.Attachment.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 9000) + 1
}

function isTrash(item: Api.Attachment.Item) {
  return !!item.deletedAt
}

function bytesToMb(bytes: number) {
  return bytes / (1024 * 1024)
}

function syncStorageUsed() {
  const usedBytes = readAll().reduce((sum, a) => sum + (a.fileSize || 0), 0)
  setStorageUsedMb(bytesToMb(usedBytes))
}

function syncGenealogyAttachmentCount(genealogyId: number) {
  try {
    const raw = localStorage.getItem('jcyunpu_mock_genealogies')
    if (!raw) return
    const list = JSON.parse(raw) as Api.Genealogy.Item[]
    const idx = list.findIndex((g) => g.id === genealogyId)
    if (idx < 0) return
    const count = readAll().filter((a) => a.genealogyId === genealogyId && !isTrash(a)).length
    list[idx] = { ...list[idx], attachmentCount: count, updatedAt: nowIso() }
    localStorage.setItem('jcyunpu_mock_genealogies', JSON.stringify(list))
  } catch {
    // ignore
  }
}

function inferFileType(ext: string, mime?: string): Api.Attachment.FileType {
  const e = ext.toLowerCase().replace(/^\./, '')
  const m = (mime || '').toLowerCase()
  if (m.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(e)) {
    return 'image'
  }
  if (m === 'application/pdf' || e === 'pdf') return 'pdf'
  if (['doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(e)) return 'doc'
  if (['tif', 'tiff'].includes(e)) return 'scan'
  return 'other'
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export async function mockListAttachments(
  params: Api.Attachment.ListParams
): Promise<Api.Common.PaginatedResponse<Api.Attachment.Item>> {
  await delay()
  const scope = params.scope || 'active'
  let list = readAll().filter((a) => a.genealogyId === params.genealogyId)
  list = scope === 'trash' ? list.filter((a) => isTrash(a)) : list.filter((a) => !isTrash(a))

  if (params.attachmentType) {
    list = list.filter((a) => a.attachmentType === params.attachmentType)
  }
  if (params.fileType) {
    list = list.filter((a) => a.fileType === params.fileType)
  }
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim().toLowerCase()
    list = list.filter((a) => a.fileName.toLowerCase().includes(kw))
  }

  list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const current = params.current || 1
  const size = params.size || 10
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    current,
    size,
    total: list.length
  }
}

export async function mockUploadAttachment(
  params: Api.Attachment.UploadParams,
  uploader: { userId: number; name: string }
): Promise<Api.Attachment.Item> {
  await delay()
  assertSubscriptionWritable('上传附件')
  if (params.fileSize <= 0) throw new Error('文件无效')
  if (params.fileSize > MAX_ATTACHMENT_BYTES) {
    throw new Error(`单文件不能超过 ${formatFileSize(MAX_ATTACHMENT_BYTES)}`)
  }
  assertStorageQuotaAvailable(params.fileSize)

  const list = readAll()
  const ext = params.fileExt.replace(/^\./, '').toLowerCase()
  const fileType = inferFileType(ext, params.mimeType)
  const ts = nowIso()
  const id = nextId(list)
  const persistContent =
    params.contentDataUrl && params.fileSize <= PERSIST_CONTENT_MAX
      ? params.contentDataUrl
      : undefined

  const item: Api.Attachment.Item = {
    id,
    genealogyId: params.genealogyId,
    projectId: params.projectId ?? null,
    fileName: params.fileName,
    fileType,
    fileExt: ext,
    fileSize: params.fileSize,
    storagePath: `mock://${params.genealogyId}/${id}.${ext}`,
    thumbnailPath: params.thumbnailPath || (fileType === 'image' ? persistContent : undefined),
    attachmentType: params.attachmentType,
    bindPersonId: params.bindPersonId ?? null,
    uploadUserId: uploader.userId,
    uploaderName: uploader.name,
    contentDataUrl: persistContent,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null
  }

  writeAll([item, ...list])
  applyStorageUsageDelta(params.fileSize, `上传附件「${item.fileName}」`)
  syncGenealogyAttachmentCount(params.genealogyId)
  appendOperationLog({
    genealogyId: params.genealogyId,
    operatorUserId: uploader.userId,
    operatorName: uploader.name,
    logCategory: 'file',
    action: 'attachment.upload',
    targetType: 'attachment',
    targetId: item.id,
    changeSummary: `上传附件「${item.fileName}」`,
    changeDetail: {
      attachmentType: { after: item.attachmentType },
      fileSize: { after: item.fileSize }
    }
  })
  return item
}

export async function mockSoftDeleteAttachment(id: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('删除附件')
  const list = readAll()
  const idx = list.findIndex((a) => a.id === id && !isTrash(a))
  if (idx < 0) throw new Error('附件不存在')
  const item = list[idx]
  list[idx] = { ...item, deletedAt: nowIso(), updatedAt: nowIso() }
  writeAll(list)
  // 回收站仍占用额度，不释放
  syncGenealogyAttachmentCount(item.genealogyId)
  appendOperationLog({
    genealogyId: item.genealogyId,
    operatorUserId: item.uploadUserId,
    operatorName: item.uploaderName || '用户',
    logCategory: 'file',
    action: 'attachment.delete',
    targetType: 'attachment',
    targetId: item.id,
    changeSummary: `删除附件「${item.fileName}」（进入回收站）`
  })
}

export async function mockRestoreAttachment(id: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('恢复附件')
  const list = readAll()
  const idx = list.findIndex((a) => a.id === id && isTrash(a))
  if (idx < 0) throw new Error('回收站中不存在该附件')
  const item = list[idx]
  list[idx] = { ...item, deletedAt: null, updatedAt: nowIso() }
  writeAll(list)
  syncGenealogyAttachmentCount(item.genealogyId)
}

export async function mockPurgeAttachment(id: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('彻底删除附件')
  const list = readAll()
  const idx = list.findIndex((a) => a.id === id && isTrash(a))
  if (idx < 0) throw new Error('回收站中不存在该附件')
  const item = list[idx]
  list.splice(idx, 1)
  writeAll(list)
  applyStorageUsageDelta(-item.fileSize, `彻底删除附件「${item.fileName}」，释放存储`)
  syncGenealogyAttachmentCount(item.genealogyId)
  appendOperationLog({
    genealogyId: item.genealogyId,
    operatorUserId: item.uploadUserId,
    operatorName: item.uploaderName || '用户',
    logCategory: 'file',
    action: 'attachment.purge',
    targetType: 'attachment',
    targetId: item.id,
    changeSummary: `彻底删除附件「${item.fileName}」`
  })
}

export async function mockGetAttachment(id: number): Promise<Api.Attachment.Item> {
  await delay()
  const item = readAll().find((a) => a.id === id)
  if (!item) throw new Error('附件不存在')
  return item
}

/** 启动时纠正存储占用（可选调用） */
export function recountAttachmentStorage() {
  syncStorageUsed()
}
