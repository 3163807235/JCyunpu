/**
 * 本族主系 vs 姻亲（嫁入挂名配偶）判定
 * 与世系图一致：无本族父/母边 + 非男 → 姻亲
 */
import { FATHER_REL_TYPES } from '@/mock/relationship'

export type PersonLineageScope = 'all' | 'lineage' | 'affinal'

const parentSet = new Set<string>([...FATHER_REL_TYPES, 'mother'])

/** 是否已挂本族父系/生母边（from=子） */
export function hasClanParentEdge(personId: number, relations: Api.Relationship.Item[]): boolean {
  return relations.some((r) => r.fromPersonId === personId && parentSet.has(r.relType))
}

/** @deprecated 使用 hasClanParentEdge */
export function hasFatherLineEdge(personId: number, relations: Api.Relationship.Item[]): boolean {
  return hasClanParentEdge(personId, relations)
}

/** 是否应按姻亲（挂名配偶）处理，而非本族吊线节点 */
export function isAffinalPerson(
  person: Api.Person.Item,
  relations: Api.Relationship.Item[]
): boolean {
  if (hasClanParentEdge(person.id, relations)) return false
  return person.gender !== 1
}

export function filterPersonsByLineageScope(
  persons: Api.Person.Item[],
  relations: Api.Relationship.Item[],
  scope: PersonLineageScope = 'all'
): Api.Person.Item[] {
  if (scope === 'all') return persons
  if (scope === 'affinal') {
    return persons.filter((p) => isAffinalPerson(p, relations))
  }
  return persons.filter((p) => !isAffinalPerson(p, relations))
}
