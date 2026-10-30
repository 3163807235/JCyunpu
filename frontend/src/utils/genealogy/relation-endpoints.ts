/**
 * 亲属关系端点规范化（产品 §3.4 + 实现基线）
 * - 父/母类：from=子，to=父/母（与世系图、更改父节点、表单生母一致）
 * - 配偶/赘婿：from=主系（优先男性），to=配偶；备注建议 `称谓|姓|名`
 */
import { FATHER_REL_TYPES } from '@/mock/relationship'

export const PARENT_REL_TYPES: Api.Relationship.RelType[] = [
  ...FATHER_REL_TYPES,
  'mother'
]

export const SPOUSE_REL_TYPES: Api.Relationship.RelType[] = ['spouse', 'zhuixu']

export function isParentRelType(t: Api.Relationship.RelType) {
  return PARENT_REL_TYPES.includes(t)
}

export function isSpouseRelType(t: Api.Relationship.RelType) {
  return SPOUSE_REL_TYPES.includes(t)
}

export interface NormalizeEndpointsResult {
  fromPersonId: number
  toPersonId: number
  /** 是否对调了用户所选主体/对象 */
  swapped: boolean
  /** 给用户的一句说明（可选） */
  tip?: string
}

/**
 * 按关系类型纠正 from/to，避免关系管理与人员列表写出相反边导致世系图断裂。
 */
export function normalizeRelationEndpoints(
  fromPersonId: number,
  toPersonId: number,
  relType: Api.Relationship.RelType,
  persons: Api.Person.Item[]
): NormalizeEndpointsResult {
  if (fromPersonId === toPersonId) {
    return { fromPersonId, toPersonId, swapped: false }
  }

  const byId = new Map(persons.map((p) => [p.id, p]))
  const a = byId.get(fromPersonId)
  const b = byId.get(toPersonId)

  if (isParentRelType(relType) && a && b) {
    // 世代号小 = 更早一辈；子的 generation 应大于父/母
    if (a.generation < b.generation) {
      return {
        fromPersonId: toPersonId,
        toPersonId: fromPersonId,
        swapped: true,
        tip: '已按「子 → 父/母」自动对调主体与对象'
      }
    }
    return { fromPersonId, toPersonId, swapped: false }
  }

  if (isSpouseRelType(relType) && a && b) {
    // 主系优先男性；两边皆男/皆女则保持用户选择
    if (a.gender !== 1 && b.gender === 1) {
      return {
        fromPersonId: toPersonId,
        toPersonId: fromPersonId,
        swapped: true,
        tip: '已按「主系（夫）→ 配偶」自动对调主体与对象'
      }
    }
    return { fromPersonId, toPersonId, swapped: false }
  }

  return { fromPersonId, toPersonId, swapped: false }
}

/** 从姓名拆姓/名，拼配偶备注（与人物表单 encode 一致） */
export function buildSpouseRemarkFromPerson(
  spouse: Api.Person.Item | undefined,
  kind = '配'
): string {
  if (!spouse?.nameWei) return ''
  const name = spouse.nameWei.replace(/（双向）/gu, '').replace(/\(双向\)/gi, '').trim()
  if (!name) return ''
  const xing = name.slice(0, 1)
  const ming = name.slice(1) || ''
  return `${kind}|${xing}|${ming}`
}
