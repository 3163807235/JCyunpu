/**
 * 协作成员 Mock（localStorage）
 * 依据：v3.1.6 §1.7.16 Collaborator；§3.4 页面 12；MVP 仅拥有者+采编
 */

import { assertSubscriptionWritable, getSubscriptionSummarySync } from './subscription'
import { appendOperationLog } from './operation-log'

const STORAGE_KEY = 'jcyunpu_mock_collaborators'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

const INVITE_DAYS = 7

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function readAll(): Api.Collaborator.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Api.Collaborator.Item[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Api.Collaborator.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId(list: Api.Collaborator.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 5000) + 1
}

function nextUserId(list: Api.Collaborator.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.userId), 20000) + 1
}

function isActiveSeat(item: Api.Collaborator.Item) {
  return item.role !== 'owner' && (item.inviteStatus === 0 || item.inviteStatus === 1)
}

function expirePending(list: Api.Collaborator.Item[], now = nowIso()) {
  let dirty = false
  const next = list.map((item) => {
    if (item.inviteStatus === 0 && item.expireAt && item.expireAt < now) {
      dirty = true
      return { ...item, inviteStatus: 3 as const, updatedAt: now }
    }
    return item
  })
  return { list: next, dirty }
}

function ensureOwner(
  list: Api.Collaborator.Item[],
  genealogyId: number,
  owner: { userId: number; displayName: string; phone: string }
) {
  const existing = list.find((c) => c.genealogyId === genealogyId && c.role === 'owner')
  if (existing) {
    if (
      existing.userId !== owner.userId ||
      existing.displayName !== owner.displayName ||
      existing.phone !== owner.phone
    ) {
      return list.map((c) =>
        c.id === existing.id
          ? {
              ...c,
              userId: owner.userId,
              displayName: owner.displayName,
              phone: owner.phone,
              inviteStatus: 1 as const,
              updatedAt: nowIso()
            }
          : c
      )
    }
    return list
  }
  const ts = nowIso()
  return [
    ...list,
    {
      id: nextId(list),
      genealogyId,
      userId: owner.userId,
      displayName: owner.displayName,
      phone: owner.phone,
      role: 'owner' as const,
      inviteStatus: 1 as const,
      joinedAt: ts,
      createdAt: ts,
      updatedAt: ts
    }
  ]
}

/**
 * 故意不回写 Project.editors / collabPhones。
 * 本期组编（Project）与长久协作（Collaborator）分属两套数据：
 * - 团队配置保存 → 可单向邀请写入 Collaborator
 * - 角色管理增删 → 只改 Collaborator，不改本期名录
 * 依据：v3.1.6 §3.4 页面 04 / 页面 12
 */

export function countCollaboratorSeats(genealogyId: number): number {
  const { list } = expirePending(readAll())
  return list.filter((c) => c.genealogyId === genealogyId && isActiveSeat(c)).length
}

export function assertCollaboratorSeatAvailable(genealogyId: number, extra = 1) {
  const summary = getSubscriptionSummarySync()
  const used = countCollaboratorSeats(genealogyId)
  if (used + extra > summary.maxCollaborators) {
    throw new Error(`协作人数已达上限（${summary.maxCollaborators}），请升级套餐后再邀请`)
  }
}

export async function mockListCollaborators(
  genealogyId: number,
  owner: { userId: number; displayName: string; phone: string }
): Promise<Api.Collaborator.ListResult> {
  await delay()
  let list = readAll()
  const expired = expirePending(list)
  list = expired.list
  list = ensureOwner(list, genealogyId, owner)
  writeAll(list)

  const summary = getSubscriptionSummarySync()
  const scoped = list
    .filter((c) => c.genealogyId === genealogyId && c.inviteStatus !== 4)
    .sort((a, b) => {
      if (a.role === 'owner') return -1
      if (b.role === 'owner') return 1
      return (a.invitedAt || a.createdAt) < (b.invitedAt || b.createdAt) ? 1 : -1
    })

  return {
    list: scoped,
    maxCollaborators: summary.maxCollaborators,
    usedSeats: scoped.filter(isActiveSeat).length
  }
}

export async function mockInviteCollaborator(
  genealogyId: number,
  params: Api.Collaborator.InviteParams,
  invitedBy: number
): Promise<Api.Collaborator.Item> {
  await delay()
  assertSubscriptionWritable('邀请协作成员')
  assertCollaboratorSeatAvailable(genealogyId)

  const phone = params.phone.trim()
  if (!/^1\d{10}$/.test(phone)) {
    throw new Error('请输入合法手机号')
  }

  let list = expirePending(readAll()).list
  const conflict = list.find(
    (c) =>
      c.genealogyId === genealogyId &&
      c.phone === phone &&
      (c.inviteStatus === 0 || c.inviteStatus === 1)
  )
  if (conflict) {
    throw new Error(conflict.role === 'owner' ? '不能邀请拥有者本人' : '该手机号已在协作名单中')
  }

  const ts = nowIso()
  const item: Api.Collaborator.Item = {
    id: nextId(list),
    genealogyId,
    userId: nextUserId(list),
    displayName: (params.displayName || '').trim() || `采编·${phone.slice(-4)}`,
    phone,
    role: 'editor',
    inviteStatus: 0,
    inviteToken: `inv-${genealogyId}-${Date.now()}`,
    invitedBy,
    invitedAt: ts,
    expireAt: addDaysIso(INVITE_DAYS),
    createdAt: ts,
    updatedAt: ts
  }
  list = [...list, item]
  writeAll(list)
  appendOperationLog({
    genealogyId,
    operatorUserId: invitedBy,
    operatorName: '拥有者',
    logCategory: 'collab',
    action: 'collaborator.invite',
    targetType: 'collaborator',
    targetId: item.id,
    changeSummary: `邀请采编「${item.displayName}」`,
    changeDetail: { phone: { after: item.phone }, role: { after: 'editor' } }
  })
  return item
}

export async function mockAcceptCollaborator(
  genealogyId: number,
  id: number
): Promise<Api.Collaborator.Item> {
  await delay()
  return acceptById(id, genealogyId)
}

/** Mock：当前用户待接受邀请（联调关 Mock 后走真实接口） */
export async function mockListMyCollaboratorInvites(): Promise<Api.Collaborator.MyInviteItem[]> {
  await delay()
  const { list } = expirePending(readAll())
  writeAll(list)
  return list
    .filter((c) => c.role !== 'owner' && c.inviteStatus === 0)
    .sort((a, b) => (a.invitedAt || '') < (b.invitedAt || '') ? 1 : -1)
    .map((c) => ({
      id: c.id,
      genealogyId: c.genealogyId,
      genealogyName: `族谱#${c.genealogyId}`,
      role: c.role,
      inviteStatus: c.inviteStatus,
      inviteToken: c.inviteToken,
      invitedBy: c.invitedBy,
      inviterName: '拥有者',
      invitedAt: c.invitedAt,
      expireAt: c.expireAt
    }))
}

export async function mockAcceptMyCollaboratorInvite(id: number): Promise<Api.Collaborator.Item> {
  await delay()
  return acceptById(id)
}

export async function mockRejectMyCollaboratorInvite(id: number): Promise<void> {
  await delay()
  const list = expirePending(readAll()).list
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0) throw new Error('邀请不存在')
  const cur = list[idx]
  if (cur.inviteStatus === 3) throw new Error('邀请已过期，请重新邀请')
  if (cur.inviteStatus !== 0) throw new Error('当前状态不可操作')
  const ts = nowIso()
  list[idx] = { ...cur, inviteStatus: 2, updatedAt: ts }
  writeAll(list)
}

function acceptById(id: number, genealogyId?: number): Api.Collaborator.Item {
  assertSubscriptionWritable('接受协作邀请')
  const list = expirePending(readAll()).list
  const idx = list.findIndex(
    (c) => c.id === id && (genealogyId == null || c.genealogyId === genealogyId)
  )
  if (idx < 0) throw new Error('邀请不存在')
  const cur = list[idx]
  if (cur.inviteStatus === 3) throw new Error('邀请已过期，请重新邀请')
  if (cur.inviteStatus !== 0) throw new Error('当前状态不可接受')
  const ts = nowIso()
  const next = { ...cur, inviteStatus: 1 as const, joinedAt: ts, updatedAt: ts }
  list[idx] = next
  writeAll(list)
  appendOperationLog({
    genealogyId: next.genealogyId,
    operatorUserId: next.userId,
    operatorName: next.displayName,
    logCategory: 'collab',
    action: 'collaborator.accept',
    targetType: 'collaborator',
    targetId: next.id,
    changeSummary: `「${next.displayName}」接受协作邀请`,
    changeDetail: { inviteStatus: { before: 0, after: 1 } }
  })
  return next
}

export async function mockRemoveCollaborator(genealogyId: number, id: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('移除协作成员')
  const list = readAll()
  const idx = list.findIndex((c) => c.id === id && c.genealogyId === genealogyId)
  if (idx < 0) throw new Error('成员不存在')
  if (list[idx].role === 'owner') throw new Error('不能移除族谱拥有者')
  const removed = list[idx]
  const ts = nowIso()
  list[idx] = { ...removed, inviteStatus: 4, updatedAt: ts }
  writeAll(list)
  appendOperationLog({
    genealogyId,
    operatorUserId: 10001,
    operatorName: '拥有者',
    logCategory: 'collab',
    action: 'collaborator.remove',
    targetType: 'collaborator',
    targetId: removed.id,
    changeSummary: `移除协作成员「${removed.displayName}」`,
    changeDetail: { inviteStatus: { before: removed.inviteStatus, after: 4 } }
  })
}
