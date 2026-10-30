import { isMockEnabled } from '@/mock/auth'
import {
  mockGetAttachment,
  mockListAttachments,
  mockPurgeAttachment,
  mockRestoreAttachment,
  mockSoftDeleteAttachment,
  mockUploadAttachment,
  MAX_ATTACHMENT_BYTES,
  formatFileSize
} from '@/mock/attachment'

export { MAX_ATTACHMENT_BYTES, formatFileSize }

export function fetchAttachmentList(params: Api.Attachment.ListParams) {
  if (isMockEnabled()) {
    return mockListAttachments(params)
  }
  throw new Error('附件列表接口尚未对接后端')
}

export function fetchUploadAttachment(
  params: Api.Attachment.UploadParams,
  uploader: { userId: number; name: string }
) {
  if (isMockEnabled()) {
    return mockUploadAttachment(params, uploader)
  }
  throw new Error('附件上传接口尚未对接后端')
}

export function fetchSoftDeleteAttachment(id: number) {
  if (isMockEnabled()) {
    return mockSoftDeleteAttachment(id)
  }
  throw new Error('删除附件接口尚未对接后端')
}

export function fetchRestoreAttachment(id: number) {
  if (isMockEnabled()) {
    return mockRestoreAttachment(id)
  }
  throw new Error('恢复附件接口尚未对接后端')
}

export function fetchPurgeAttachment(id: number) {
  if (isMockEnabled()) {
    return mockPurgeAttachment(id)
  }
  throw new Error('彻底删除附件接口尚未对接后端')
}

export function fetchAttachmentDetail(id: number) {
  if (isMockEnabled()) {
    return mockGetAttachment(id)
  }
  throw new Error('附件详情接口尚未对接后端')
}
