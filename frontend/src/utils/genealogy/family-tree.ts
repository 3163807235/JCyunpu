/**
 * 将活数据人物 + 关系转为 vue-family-tree-chart 的 FamilyNode 树
 *
 * 关系约定（产品 §1.7 / §3.4）：
 * - 父子：from=子，to=父
 * - 配偶：from=夫，to=妻（Mock 可能双向各存一条）
 *
 * 组件约定：spouse: string[] 为同一主节点旁的多任配偶文字（非独立节点）。
 */

import type { FamilyNode } from 'vue-family-tree-chart'
import { FATHER_REL_TYPES } from '@/mock/relationship'
import { isXingdiUnknown } from '@/utils/genealogy/xingdi'
import { isAffinalPerson } from '@/utils/genealogy/person-lineage'

const PARENT_PRIORITY: Api.Relationship.RelType[] = [
  'father',
  'sifu',
  'jiantiao',
  'jifu',
  'yifu',
  'mother'
]

const INHERIT_BY_REL: Partial<Record<Api.Relationship.RelType, string>> = {
  sifu: '承继',
  jiantiao: '兼祧',
  chuji: '过继'
}

const FOREST_ROOT_ID = '__forest_root__'

function toGender(g: Api.Person.Gender): FamilyNode['gender'] {
  return g === 2 ? 'f' : 'm'
}

function xingdiRank(xingdi?: string | null): number {
  if (!xingdi || isXingdiUnknown(xingdi)) return Number.MAX_SAFE_INTEGER
  const n = Number.parseInt(String(xingdi).trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : Number.MAX_SAFE_INTEGER
}

function sortSiblings(a: Api.Person.Item, b: Api.Person.Item) {
  const ra = xingdiRank(a.xingdi)
  const rb = xingdiRank(b.xingdi)
  if (ra !== rb) return ra - rb
  if (a.generation !== b.generation) return a.generation - b.generation
  return a.id - b.id
}

function cleanPersonLabel(name: string) {
  return name
    .replace(/（双向）/gu, '')
    .replace(/\(双向\)/gi, '')
    .trim()
}

function addSpouseName(map: Map<number, string[]>, holderId: number, name: string) {
  const clean = cleanPersonLabel(name)
  if (!clean) return
  const list = map.get(holderId) || []
  if (!list.includes(clean)) list.push(clean)
  map.set(holderId, list)
}

function addPartner(map: Map<number, number[]>, a: number, b: number) {
  const list = map.get(a) || []
  if (!list.includes(b)) list.push(b)
  map.set(a, list)
}

function countDescendants(rootId: number, childrenOf: Map<number, number[]>): number {
  let n = 0
  const stack = [...(childrenOf.get(rootId) || [])]
  while (stack.length) {
    const id = stack.pop()!
    n++
    const kids = childrenOf.get(id)
    if (kids?.length) stack.push(...kids)
  }
  return n
}

/** 该人物是否应以「挂名配偶」而非吊线节点出现（与人员列表姻亲筛选同源） */
function shouldBeSpouseText(
  id: number,
  byId: Map<number, Api.Person.Item>,
  relations: Api.Relationship.Item[]
): boolean {
  const p = byId.get(id)
  if (!p) return false
  return isAffinalPerson(p, relations)
}

export function buildFamilyTree(
  persons: Api.Person.Item[],
  relations: Api.Relationship.Item[]
): FamilyNode | null {
  if (!persons.length) return null

  const byId = new Map(persons.map((p) => [p.id, p]))
  const fatherSet = new Set<string>(FATHER_REL_TYPES)

  const parentEdge = new Map<
    number,
    { parentId: number; relType: Api.Relationship.RelType; priority: number }
  >()
  const inheritOf = new Map<number, string>()
  /** 无向：每人的配偶伙伴 id 列表（保序、去重；双向边只记一次伙伴） */
  const partnersOf = new Map<number, number[]>()

  for (const r of relations) {
    const inherit = INHERIT_BY_REL[r.relType]
    if (inherit && byId.has(r.fromPersonId)) {
      if (!inheritOf.has(r.fromPersonId)) inheritOf.set(r.fromPersonId, inherit)
    }

    if (r.relType === 'spouse' || r.relType === 'zhuixu') {
      if (!byId.has(r.fromPersonId) || !byId.has(r.toPersonId)) continue
      addPartner(partnersOf, r.fromPersonId, r.toPersonId)
      addPartner(partnersOf, r.toPersonId, r.fromPersonId)
      continue
    }

    if (!fatherSet.has(r.relType) && r.relType !== 'mother') continue
    const childId = r.fromPersonId
    const parentId = r.toPersonId
    if (!byId.has(childId) || !byId.has(parentId)) continue
    const priority = PARENT_PRIORITY.indexOf(r.relType)
    if (priority < 0) continue
    const prev = parentEdge.get(childId)
    if (!prev || priority < prev.priority) {
      parentEdge.set(childId, { parentId, relType: r.relType, priority })
    }
  }

  const spouseNames = new Map<number, string[]>()
  const excludeAsNode = new Set<number>()
  const affinalToHolder = new Map<number, number>()

  // 1) 先标记所有应挂名的姻亲（无父系非男）
  for (const p of persons) {
    if (shouldBeSpouseText(p.id, byId, relations)) {
      excludeAsNode.add(p.id)
    }
  }

  // 2) 对每个将占节点的人，把它的全部配偶伙伴姓名写入 spouse[]（显式支持两任/多任）
  for (const p of persons) {
    if (excludeAsNode.has(p.id)) continue
    const partners = partnersOf.get(p.id) || []
    for (const pid of partners) {
      const partner = byId.get(pid)
      if (!partner) continue
      if (!shouldBeSpouseText(pid, byId, relations) && !excludeAsNode.has(pid)) {
        // 双方都是本家节点（如姐弟误标配偶）——不互挂
        continue
      }
      excludeAsNode.add(pid)
      affinalToHolder.set(pid, p.id)
      addSpouseName(spouseNames, p.id, partner.nameWei)
    }
  }

  // 3) 仍被排除但尚未挂到任何人名下的姻亲：补挂到其伙伴中第一个占节点者
  for (const id of [...excludeAsNode]) {
    const p = byId.get(id)
    if (!p) continue
    const alreadyOnHolder =
      affinalToHolder.has(id) &&
      (spouseNames.get(affinalToHolder.get(id)!) || []).includes(p.nameWei)
    if (alreadyOnHolder) continue

    const partners = partnersOf.get(id) || []
    const holderId = partners.find((pid) => !excludeAsNode.has(pid))
    if (holderId == null) continue
    affinalToHolder.set(id, holderId)
    addSpouseName(spouseNames, holderId, p.nameWei)
  }

  // 4) 重建 childrenOf；子女若误挂在姻亲母下，改挂其夫
  const childrenOf = new Map<number, number[]>()
  parentEdge.forEach((edge, childId) => {
    let parentId = edge.parentId
    if (excludeAsNode.has(parentId)) {
      const holder = affinalToHolder.get(parentId)
      if (holder != null && byId.has(holder) && !excludeAsNode.has(holder)) {
        parentId = holder
        parentEdge.set(childId, { ...edge, parentId: holder })
      }
    }
    if (excludeAsNode.has(childId)) return
    if (excludeAsNode.has(parentId)) return
    const list = childrenOf.get(parentId) || []
    if (!list.includes(childId)) list.push(childId)
    childrenOf.set(parentId, list)
  })

  childrenOf.forEach((ids, parentId) => {
    ids.sort((ia, ib) => sortSiblings(byId.get(ia)!, byId.get(ib)!))
    childrenOf.set(parentId, ids)
  })

  let roots = persons
    .filter((p) => !parentEdge.has(p.id) && !excludeAsNode.has(p.id))
    .sort((a, b) => {
      if (a.generation !== b.generation) return a.generation - b.generation
      const da = countDescendants(a.id, childrenOf)
      const db = countDescendants(b.id, childrenOf)
      if (da !== db) return db - da
      return sortSiblings(a, b)
    })

  if (!roots.length) {
    const fallback =
      [...persons]
        .filter((p) => !excludeAsNode.has(p.id))
        .sort((a, b) => {
          if (a.generation !== b.generation) return a.generation - b.generation
          return a.id - b.id
        })[0] || persons[0]
    roots = [fallback]
  }

  if (roots.length > 1) {
    const minGen = roots[0].generation
    const sameGen = roots.filter((r) => r.generation === minGen)
    const withKids = sameGen.filter((r) => countDescendants(r.id, childrenOf) > 0)
    if (withKids.length === 1) {
      roots = [withKids[0], ...roots.filter((r) => r.generation !== minGen)]
    } else if (withKids.length === 0 && sameGen.length > 1) {
      const male = sameGen.find((r) => r.gender === 1) || sameGen[0]
      roots = [male, ...roots.filter((r) => r.generation !== minGen && r.id !== male.id)]
    }
  }

  const visiting = new Set<number>()

  const buildNode = (id: number): FamilyNode | null => {
    const p = byId.get(id)
    if (!p) return null
    if (excludeAsNode.has(id)) return null
    if (visiting.has(id)) return null
    visiting.add(id)

    const childIds = (childrenOf.get(id) || []).filter(
      (cid) => !visiting.has(cid) && !excludeAsNode.has(cid)
    )
    const children = childIds.map((cid) => buildNode(cid)).filter((n): n is FamilyNode => !!n)

    visiting.delete(id)

    const spouses = spouseNames.get(id)
    const inherit = inheritOf.get(id)

    return {
      id: String(p.id),
      name: cleanPersonLabel(p.nameWei) || `未名#${p.id}`,
      gender: toGender(p.gender),
      spouse: spouses?.length ? spouses : null,
      inherit: inherit || null,
      courtesyName: p.nameZi || null,
      hao: p.nameHao || null,
      bio: p.biography || null,
      children: children.length ? children : undefined
    }
  }

  const rootNodes = roots.map((r) => buildNode(r.id)).filter((n): n is FamilyNode => !!n)

  if (!rootNodes.length) return null
  if (rootNodes.length === 1) return rootNodes[0]

  return {
    id: FOREST_ROOT_ID,
    name: '本族',
    gender: 'm',
    children: rootNodes
  }
}

export function isForestRootId(id: string) {
  return id === FOREST_ROOT_ID
}
