/**
 * 族谱成员 + 成员邀请码 Mock
 * 依据：家传云谱·族谱成员与邀请码设计说明_v0.1.md
 * 与 Collaborator / Project.editors 分离；不占协作席位
 */

import { genealogyNoFromId } from '@/utils/genealogy/genealogy-no'
import { isValidInviteCodeFormat, normalizeInviteCode } from '@/utils/genealogy/invite-code'

export { isValidInviteCodeFormat }

const MEMBERS_KEY = 'jcyunpu_mock_genealogy_members'
const CODES_KEY = 'jcyunpu_mock_genealogy_invite_codes'
const GENEALOGY_KEY = 'jcyunpu_mock_genealogies'

/** Mock 当前登录用户（与 mockGetUserInfo.userId 一致） */
export const MOCK_CURRENT_USER_ID = 10001
/** 演示谱拥有者（非当前用户，便于验收「邀请码加入」） */
export const MOCK_DEMO_OWNER_USER_ID = 99999
export const MOCK_DEMO_INVITE_CODE = 'YCDEMO01'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readMembers(): Api.GenealogyMember.Item[] {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    return raw ? (JSON.parse(raw) as Api.GenealogyMember.Item[]) : []
  } catch {
    return []
  }
}

function writeMembers(list: Api.GenealogyMember.Item[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(list))
}

function readCodes(): Api.GenealogyMember.InviteCode[] {
  try {
    const raw = localStorage.getItem(CODES_KEY)
    return raw ? (JSON.parse(raw) as Api.GenealogyMember.InviteCode[]) : []
  } catch {
    return []
  }
}

function writeCodes(list: Api.GenealogyMember.InviteCode[]) {
  localStorage.setItem(CODES_KEY, JSON.stringify(list))
}

function readGenealogies(): Api.Genealogy.Item[] {
  try {
    const raw = localStorage.getItem(GENEALOGY_KEY)
    return raw ? (JSON.parse(raw) as Api.Genealogy.Item[]) : []
  } catch {
    return []
  }
}

function writeGenealogies(list: Api.Genealogy.Item[]) {
  localStorage.setItem(GENEALOGY_KEY, JSON.stringify(list))
}

function nextMemberId(list: Api.GenealogyMember.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 8000) + 1
}

function nextCodeId(list: Api.GenealogyMember.InviteCode[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 9000) + 1
}

/** 8 位易读码：排除 0OIL1 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

function normalizeCode(code: string) {
  return normalizeInviteCode(code)
}

export function getActiveInviteCode(genealogyId: number): Api.GenealogyMember.InviteCode | null {
  return readCodes().find((c) => c.genealogyId === genealogyId && c.status === 1) || null
}

/** 建谱时生成成员邀请码 */
export function ensureInviteCodeForGenealogy(
  genealogyId: number,
  createdBy = MOCK_CURRENT_USER_ID,
  preferredCode?: string
): Api.GenealogyMember.InviteCode {
  const existing = getActiveInviteCode(genealogyId)
  if (existing) return existing

  const list = readCodes()
  const code = preferredCode ? normalizeCode(preferredCode) : generateCode()
  const conflict = list.some((c) => c.status === 1 && normalizeCode(c.code) === code)
  const finalCode = conflict ? generateCode() : code
  const item: Api.GenealogyMember.InviteCode = {
    id: nextCodeId(list),
    genealogyId,
    code: finalCode,
    status: 1,
    maxUses: 200,
    usedCount: 0,
    expireAt: null,
    createdBy,
    createdAt: nowIso()
  }
  list.push(item)
  writeCodes(list)
  return item
}

export function rotateInviteCode(
  genealogyId: number,
  createdBy = MOCK_CURRENT_USER_ID
): Api.GenealogyMember.InviteCode {
  const list = readCodes()
  const ts = nowIso()
  const next = list.map((c) =>
    c.genealogyId === genealogyId && c.status === 1
      ? { ...c, status: 0 as const, revokedAt: ts }
      : c
  )
  const item: Api.GenealogyMember.InviteCode = {
    id: nextCodeId(next),
    genealogyId,
    code: generateCode(),
    status: 1,
    maxUses: 200,
    usedCount: 0,
    expireAt: null,
    createdBy,
    createdAt: ts
  }
  next.push(item)
  writeCodes(next)
  return item
}

/** 演示谱：固定邀请码，便于验收加入流程 */
export function ensureDemoMemberGenealogy() {
  const list = readGenealogies()
  let demo = list.find((g) => g.id === 1999)
  if (!demo) {
    const createdAt = nowIso()
    demo = {
      id: 1999,
      genealogyNo: genealogyNoFromId(1999),
      name: '演示·颍川陈氏族谱',
      surname: '陈',
      hallName: '颍川堂',
      ancestor: '陈寔',
      privacy: 1,
      livingDesensitize: 1,
      mode: 'simple',
      personCount: 0,
      attachmentCount: 0,
      projectCount: 1,
      currentStage: 1,
      stageSchema: 2,
      layoutDirty: 0,
      ownerUserId: MOCK_DEMO_OWNER_USER_ID,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null
    }
    list.push(demo)
    writeGenealogies(list)
  } else {
    let dirty = false
    if (demo.ownerUserId == null) {
      demo = { ...demo, ownerUserId: MOCK_DEMO_OWNER_USER_ID }
      dirty = true
    }
    if (!demo.genealogyNo) {
      demo = { ...demo, genealogyNo: genealogyNoFromId(1999) }
      dirty = true
    }
    if (dirty) writeGenealogies(list.map((g) => (g.id === 1999 ? demo! : g)))
  }
  ensureInviteCodeForGenealogy(1999, MOCK_DEMO_OWNER_USER_ID, MOCK_DEMO_INVITE_CODE)
}

function findActiveCode(codeRaw: string): Api.GenealogyMember.InviteCode | null {
  const code = normalizeCode(codeRaw)
  if (!code) return null
  return readCodes().find((c) => c.status === 1 && normalizeCode(c.code) === code) || null
}

function getGenealogyOrThrow(id: number): Api.Genealogy.Item {
  const item = readGenealogies().find((g) => g.id === id && !g.deletedAt)
  if (!item) throw new Error('族谱不存在或已删除')
  return item
}

export function resolveMembership(
  genealogy: Api.Genealogy.Item,
  userId = MOCK_CURRENT_USER_ID
): Api.Genealogy.Membership {
  const ownerId = genealogy.ownerUserId ?? MOCK_CURRENT_USER_ID
  if (ownerId === userId) return 'owner'
  const member = readMembers().find(
    (m) => m.genealogyId === genealogy.id && m.userId === userId && m.status === 1
  )
  if (member) return 'member'
  return 'none'
}

export function enrichGenealogyItem(
  item: Api.Genealogy.Item,
  userId = MOCK_CURRENT_USER_ID
): Api.Genealogy.Item {
  const membership = resolveMembership(item, userId)
  return {
    ...item,
    ownerUserId: item.ownerUserId ?? MOCK_CURRENT_USER_ID,
    membership: membership === 'none' ? undefined : membership
  }
}

export async function mockPreviewInviteCode(
  codeRaw: string
): Promise<Api.GenealogyMember.InvitePreview> {
  await delay()
  ensureDemoMemberGenealogy()
  if (!codeRaw?.trim()) throw new Error('请输入族谱邀请码')
  if (!isValidInviteCodeFormat(codeRaw)) throw new Error('邀请码格式不正确')
  const invite = findActiveCode(codeRaw)
  if (!invite) throw new Error('邀请码无效或已作废')
  if (invite.expireAt && invite.expireAt < nowIso()) throw new Error('邀请码已过期')
  if (invite.maxUses != null && invite.usedCount >= invite.maxUses) {
    throw new Error('邀请码使用次数已用尽')
  }
  const g = getGenealogyOrThrow(invite.genealogyId)
  return {
    genealogyId: g.id,
    name: g.name,
    surname: g.surname,
    hallName: g.hallName,
    code: invite.code
  }
}

function assertCanJoin(genealogyId: number, userId: number) {
  const g = getGenealogyOrThrow(genealogyId)
  const ownerId = g.ownerUserId ?? MOCK_CURRENT_USER_ID
  if (ownerId === userId) throw new Error('你已是该族谱拥有者，无需加入')
  const existed = readMembers().find(
    (m) => m.genealogyId === genealogyId && m.userId === userId && m.status === 1
  )
  if (existed) throw new Error('你已是该族谱成员')
}

function addMember(
  genealogyId: number,
  userId: number,
  source: Api.GenealogyMember.JoinSource,
  codeUsed: string,
  displayName?: string
): Api.GenealogyMember.Item {
  assertCanJoin(genealogyId, userId)
  const invite = findActiveCode(codeUsed)
  if (!invite || invite.genealogyId !== genealogyId) throw new Error('邀请码无效')
  if (invite.expireAt && invite.expireAt < nowIso()) throw new Error('邀请码已过期')
  if (invite.maxUses != null && invite.usedCount >= invite.maxUses) {
    throw new Error('邀请码使用次数已用尽')
  }

  const members = readMembers()
  const ts = nowIso()
  const prev = members.findIndex((m) => m.genealogyId === genealogyId && m.userId === userId)
  const row: Api.GenealogyMember.Item = {
    id: prev >= 0 ? members[prev].id : nextMemberId(members),
    genealogyId,
    userId,
    displayName: displayName || '',
    status: 1,
    joinSource: source,
    inviteCodeUsed: normalizeCode(codeUsed),
    joinedAt: ts,
    createdAt: prev >= 0 ? members[prev].createdAt : ts,
    updatedAt: ts
  }
  if (prev >= 0) members[prev] = row
  else members.push(row)
  writeMembers(members)

  const codes = readCodes().map((c) =>
    c.id === invite.id ? { ...c, usedCount: c.usedCount + 1 } : c
  )
  writeCodes(codes)
  return row
}

export async function mockJoinByInviteCode(
  codeRaw: string,
  userId = MOCK_CURRENT_USER_ID,
  source: Api.GenealogyMember.JoinSource = 'manual_code'
): Promise<Api.Genealogy.Item> {
  await delay()
  ensureDemoMemberGenealogy()
  if (!isValidInviteCodeFormat(codeRaw)) throw new Error('邀请码格式不正确')
  const invite = findActiveCode(codeRaw)
  if (!invite) throw new Error('邀请码无效或已作废')
  addMember(invite.genealogyId, userId, source, invite.code)
  const g = getGenealogyOrThrow(invite.genealogyId)
  return enrichGenealogyItem(g, userId)
}

/** 注册成功后带码加入；失败抛错（整单失败策略） */
export function mockJoinOnRegister(inviteCode: string | undefined, userId = MOCK_CURRENT_USER_ID) {
  ensureDemoMemberGenealogy()
  const code = (inviteCode || '').trim()
  if (!code) return null
  if (!isValidInviteCodeFormat(code)) throw new Error('邀请码格式不正确')
  const invite = findActiveCode(code)
  if (!invite) throw new Error('邀请码无效或已作废')
  addMember(invite.genealogyId, userId, 'register_invite', invite.code)
  return invite.genealogyId
}

export async function mockGetInviteCode(
  genealogyId: number
): Promise<Api.GenealogyMember.InviteCode> {
  await delay()
  const g = getGenealogyOrThrow(genealogyId)
  if ((g.ownerUserId ?? MOCK_CURRENT_USER_ID) !== MOCK_CURRENT_USER_ID) {
    throw new Error('仅拥有者可查看成员邀请码')
  }
  return ensureInviteCodeForGenealogy(genealogyId)
}

export async function mockRotateInviteCode(
  genealogyId: number
): Promise<Api.GenealogyMember.InviteCode> {
  await delay()
  const g = getGenealogyOrThrow(genealogyId)
  if ((g.ownerUserId ?? MOCK_CURRENT_USER_ID) !== MOCK_CURRENT_USER_ID) {
    throw new Error('仅拥有者可重置成员邀请码')
  }
  return rotateInviteCode(genealogyId)
}

export async function mockListMembers(genealogyId: number): Promise<Api.GenealogyMember.Item[]> {
  await delay()
  const g = getGenealogyOrThrow(genealogyId)
  if ((g.ownerUserId ?? MOCK_CURRENT_USER_ID) !== MOCK_CURRENT_USER_ID) {
    throw new Error('仅拥有者可查看成员名单')
  }
  return readMembers()
    .filter((m) => m.genealogyId === genealogyId && m.status === 1)
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
}

export async function mockRemoveMember(genealogyId: number, userId: number): Promise<void> {
  await delay()
  const g = getGenealogyOrThrow(genealogyId)
  if ((g.ownerUserId ?? MOCK_CURRENT_USER_ID) !== MOCK_CURRENT_USER_ID) {
    throw new Error('仅拥有者可移除成员')
  }
  const list = readMembers()
  const idx = list.findIndex(
    (m) => m.genealogyId === genealogyId && m.userId === userId && m.status === 1
  )
  if (idx < 0) throw new Error('成员不存在')
  const ts = nowIso()
  list[idx] = { ...list[idx], status: 3, leftAt: ts, updatedAt: ts }
  writeMembers(list)
}

export async function mockLeaveMember(genealogyId: number): Promise<void> {
  await delay()
  const userId = MOCK_CURRENT_USER_ID
  const list = readMembers()
  const idx = list.findIndex(
    (m) => m.genealogyId === genealogyId && m.userId === userId && m.status === 1
  )
  if (idx < 0) throw new Error('你不是该族谱成员')
  const ts = nowIso()
  list[idx] = { ...list[idx], status: 2, leftAt: ts, updatedAt: ts }
  writeMembers(list)
}

/** 供列表：当前用户可见的族谱（自建 + 成员） */
export function listAccessibleGenealogyIds(userId = MOCK_CURRENT_USER_ID): {
  ownedIds: Set<number>
  memberIds: Set<number>
} {
  ensureDemoMemberGenealogy()
  const ownedIds = new Set(
    readGenealogies()
      .filter((g) => !g.deletedAt && (g.ownerUserId ?? MOCK_CURRENT_USER_ID) === userId)
      .map((g) => g.id)
  )
  const memberIds = new Set(
    readMembers()
      .filter((m) => m.userId === userId && m.status === 1)
      .map((m) => m.genealogyId)
  )
  return { ownedIds, memberIds }
}
