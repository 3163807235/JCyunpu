/**
 * 族内只读分享链接 Mock
 * 依据：v3.1.6 §1.8.6；模块 M
 */

import { assertSubscriptionWritable } from './subscription'
import { appendOperationLog } from './operation-log'
import { listFamilyEventsSync, listFamilyRulesSync } from './culture'

const STORAGE_KEY = 'jcyunpu_mock_share_links'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readAll(): Api.ShareLink.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Api.ShareLink.Item[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Api.ShareLink.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId(list: Api.ShareLink.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 11000) + 1
}

function randomToken() {
  const arr = new Uint8Array(24)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function isActive(link: Api.ShareLink.Item) {
  if (link.revokedAt) return false
  if (link.expireAt && link.expireAt < nowIso()) return false
  return true
}

function desensitizeBirth(
  birthDate: string | undefined,
  isAlive: 0 | 1,
  level: Api.Genealogy.LivingDesensitize
): string | undefined {
  if (!birthDate || isAlive !== 1) return birthDate
  if (level === 3) return birthDate
  if (level === 2) {
    const year = birthDate.match(/\d{4}/)?.[0]
    return year ? `${year}年` : '生年已脱敏'
  }
  return '生卒已脱敏'
}

export async function mockListShareLinks(genealogyId: number): Promise<Api.ShareLink.Item[]> {
  await delay()
  return readAll()
    .filter((l) => l.genealogyId === genealogyId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function mockCreateShareLink(
  params: Api.ShareLink.CreateParams,
  userId: number
): Promise<Api.ShareLink.Item> {
  await delay()
  assertSubscriptionWritable('生成分享链接')
  const list = readAll()
  // 同谱仅保留一条有效链接：生成新链时自动撤销旧链
  const nextList = list.map((l) =>
    l.genealogyId === params.genealogyId && isActive(l) ? { ...l, revokedAt: nowIso() } : l
  )
  const ts = nowIso()
  const item: Api.ShareLink.Item = {
    id: nextId(nextList),
    genealogyId: params.genealogyId,
    token: randomToken(),
    expireAt: params.expireDays === 0 ? null : addDaysIso(params.expireDays),
    createdBy: userId,
    createdAt: ts,
    accessCount: 0
  }
  writeAll([item, ...nextList])
  appendOperationLog({
    genealogyId: params.genealogyId,
    operatorUserId: userId,
    operatorName: '拥有者',
    logCategory: 'setting',
    action: 'share_link.create',
    targetType: 'share_link',
    targetId: item.id,
    changeSummary: '生成族内只读分享链接',
    changeDetail: {
      expireDays: { after: params.expireDays },
      token: { after: `${item.token.slice(0, 8)}…` }
    }
  })
  return item
}

export async function mockRevokeShareLink(id: number, userId: number): Promise<void> {
  await delay()
  assertSubscriptionWritable('撤销分享链接')
  const list = readAll()
  const idx = list.findIndex((l) => l.id === id)
  if (idx < 0) throw new Error('链接不存在')
  if (list[idx].revokedAt) throw new Error('链接已撤销')
  list[idx] = { ...list[idx], revokedAt: nowIso() }
  writeAll(list)
  appendOperationLog({
    genealogyId: list[idx].genealogyId,
    operatorUserId: userId,
    operatorName: '拥有者',
    logCategory: 'setting',
    action: 'share_link.revoke',
    targetType: 'share_link',
    targetId: id,
    changeSummary: '撤销族内只读分享链接'
  })
}

export async function mockGetSharePublicView(token: string): Promise<Api.ShareLink.PublicView> {
  await delay()
  const link = readAll().find((l) => l.token === token)
  if (!link) throw new Error('分享链接无效')
  if (link.revokedAt) throw new Error('分享链接已撤销')
  if (link.expireAt && link.expireAt < nowIso()) throw new Error('分享链接已过期')

  // 访问计数
  const all = readAll()
  const idx = all.findIndex((l) => l.id === link.id)
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      accessCount: (all[idx].accessCount || 0) + 1,
      lastAccessAt: nowIso()
    }
    writeAll(all)
  }

  appendOperationLog({
    genealogyId: link.genealogyId,
    operatorUserId: null,
    operatorName: '访客',
    logCategory: 'setting',
    action: 'share_link.access',
    targetType: 'share_link',
    targetId: link.id,
    changeSummary: '访问族内只读分享链接'
  })

  let genealogy: Api.Genealogy.Item | undefined
  try {
    const raw = localStorage.getItem('jcyunpu_mock_genealogies')
    const list = raw ? (JSON.parse(raw) as Api.Genealogy.Item[]) : []
    genealogy = list.find((g) => g.id === link.genealogyId && !g.deletedAt)
  } catch {
    genealogy = undefined
  }
  if (!genealogy) throw new Error('族谱不存在或已删除')

  const level = (genealogy.livingDesensitize ?? 1) as Api.Genealogy.LivingDesensitize
  // 公开浏览者始终最严格脱敏（§1.8.2）——分享访客按严格级
  const visitorLevel: Api.Genealogy.LivingDesensitize = 1

  let persons: Api.Person.Item[] = []
  try {
    const raw = localStorage.getItem('jcyunpu_mock_persons')
    persons = raw ? (JSON.parse(raw) as Api.Person.Item[]) : []
  } catch {
    persons = []
  }

  const publicPersons = persons
    .filter((p) => p.genealogyId === link.genealogyId && !p.deletedAt)
    .filter((p) => (p.privacyLevel ?? 1) !== 3) // 私密人物对访客不可见
    .map((p) => ({
      id: p.id,
      personNo: p.personNo,
      generation: p.generation,
      nameWei: p.nameWei,
      gender: p.gender,
      birthDate: desensitizeBirth(p.birthDate, p.isAlive, visitorLevel),
      deathDate: p.isAlive === 1 ? undefined : p.deathDate,
      isAlive: p.isAlive,
      zibei: p.zibei
    }))
    .sort((a, b) => a.generation - b.generation || a.id - b.id)

  // level unused except documenting genealogy setting; visitor always strict
  void level

  return {
    genealogy: {
      id: genealogy.id,
      name: genealogy.name,
      surname: genealogy.surname,
      hallName: genealogy.hallName,
      ancestor: genealogy.ancestor,
      privacy: genealogy.privacy,
      livingDesensitize: genealogy.livingDesensitize
    },
    persons: publicPersons,
    rules: listFamilyRulesSync(link.genealogyId),
    events: listFamilyEventsSync(link.genealogyId),
    readonly: true
  }
}
