/**
 * 行第（排行）转换
 * 录入存数字（1、2、3…）或 unknown（不详）；展示按同父/母下子女数转为汉字：
 * - 不详 → 不详
 * - 父/母下仅 1 个子女 → 之子 / 之女
 * - 2 人及以上 → 按全体子女总排行：长子/长女、次子/次女、三子…
 * 依据：产品文档 §1.7 / §3.4 行第字段；展示规则为产品录入约定
 */

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const CN_ORDINAL_MAP: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10
}

/** 排行不详（年代久远不知长幼）存库值 */
export const XINGDI_UNKNOWN = 'unknown'

/** 录入选项：不详 + 数字 1–12 */
export const XINGDI_RANK_OPTIONS = [
  { value: XINGDI_UNKNOWN, label: '不详' },
  ...Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    return { value: String(n), label: String(n) }
  })
]

/** 是否为「不详」 */
export function isXingdiUnknown(xingdi?: string | null): boolean {
  const raw = (xingdi || '').trim()
  return raw === XINGDI_UNKNOWN || raw === '不详'
}

/** 阿拉伯数字 → 中文序号（3→三 … 10→十 … 12→十二）；2 在排行文案中用「次」 */
export function toChineseOrdinal(n: number): string {
  if (n <= 0) return String(n)
  if (n < 10) return CN_DIGITS[n]
  if (n === 10) return '十'
  if (n < 20) return `十${CN_DIGITS[n - 10]}`
  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return `${CN_DIGITS[tens]}十${ones ? CN_DIGITS[ones] : ''}`
  }
  return String(n)
}

/** 中文序号片段 → 数字（三→3，十一→11，十二→12） */
function parseChineseOrdinalToken(token: string): number | null {
  const t = token.trim()
  if (!t) return null
  if (t === '十') return 10
  if (t.startsWith('十') && t.length === 2) {
    const ones = CN_ORDINAL_MAP[t[1]]
    return ones != null && ones > 0 ? 10 + ones : null
  }
  if (t.endsWith('十') && t.length === 2) {
    const tens = CN_ORDINAL_MAP[t[0]]
    return tens != null && tens > 0 ? tens * 10 : null
  }
  if (t.length === 3 && t[1] === '十') {
    const tens = CN_ORDINAL_MAP[t[0]]
    const ones = CN_ORDINAL_MAP[t[2]]
    if (tens != null && ones != null) return tens * 10 + ones
  }
  if (t.length === 1 && CN_ORDINAL_MAP[t] != null && CN_ORDINAL_MAP[t] > 0) {
    return CN_ORDINAL_MAP[t]
  }
  return null
}

/**
 * 解析存库的排行：数字，或旧汉字文案（之子/长子/次女/二子…）
 * 「之子/之女」一律视为排行 1，再由 siblingCount 决定展示「之X」还是「长X」
 */
export function parseXingdiRank(xingdi?: string | null): number | null {
  if (!xingdi?.trim() || isXingdiUnknown(xingdi)) return null
  const raw = xingdi.trim()
  const n = Number(raw)
  if (Number.isFinite(n) && n >= 1) return Math.floor(n)

  if (raw === '之子' || raw === '之女' || raw === '长子' || raw === '长女' || raw === '长') {
    return 1
  }
  if (/^次[子女]?$/.test(raw) || /^二[子女]?$/.test(raw)) return 2

  const m = raw.match(/^([一二三四五六七八九十]+)[子女]?$/)
  if (m) {
    const ord = parseChineseOrdinalToken(m[1])
    if (ord != null && ord >= 1) return ord
  }
  return null
}

/** 子/女后缀；未知性别返回空 */
export function genderXingdiSuffix(gender: Api.Person.Gender): '子' | '女' | '' {
  if (gender === 1) return '子'
  if (gender === 2) return '女'
  return ''
}

/**
 * 按排行数字 + 性别 + 同父/母下子女总数生成展示文案
 * @param siblingCount 同父（或同母）下子女总数（含本人，不分性别）
 */
export function formatXingdiLabel(
  gender: Api.Person.Gender,
  xingdi: string | undefined | null,
  siblingCount = 0
): string {
  if (isXingdiUnknown(xingdi)) return '不详'

  const suffix = genderXingdiSuffix(gender)
  const rank = parseXingdiRank(xingdi)

  // 无法解析的旧文本：多人时勿原样吐出「之子」
  if (rank == null) {
    const raw = xingdi?.trim() || '—'
    if (siblingCount > 1 && (raw === '之子' || raw === '之女')) {
      return suffix ? `长${suffix}` : '长'
    }
    return raw
  }
  if (!suffix) return String(rank)

  // 父/母节点下仅有一个子女
  if (siblingCount <= 1) {
    return `之${suffix}`
  }

  if (rank === 1) return `长${suffix}`
  if (rank === 2) return `次${suffix}`
  return `${toChineseOrdinal(rank)}${suffix}`
}

const FATHER_REL_TYPES: Api.Relationship.RelType[] = ['father', 'sifu', 'jiantiao', 'jifu', 'yifu']

const PARENT_REL_TYPES: Api.Relationship.RelType[] = [...FATHER_REL_TYPES, 'mother']

/**
 * 同胞分组用的父/母节点：优先父系边（兄弟姊妹同父），否则生母
 */
export function getPrimaryParentId(
  personId: number,
  relations: Api.Relationship.Item[]
): number | null {
  const mine = relations.filter((r) => r.fromPersonId === personId)
  const father = mine.find((r) => FATHER_REL_TYPES.includes(r.relType))
  if (father) return father.toPersonId
  const mother = mine.find((r) => r.relType === 'mother')
  return mother?.toPersonId ?? null
}

/** 同父/母下全部子女 id（含本人） */
export function listSiblingIds(personId: number, relations: Api.Relationship.Item[]): number[] {
  const parentId = getPrimaryParentId(personId, relations)
  const ids = new Set<number>([personId])
  if (!parentId) return [...ids]
  for (const r of relations) {
    if (r.toPersonId !== parentId) continue
    if (!PARENT_REL_TYPES.includes(r.relType)) continue
    ids.add(r.fromPersonId)
  }
  return [...ids]
}

/** 同父/母下子女总数（含本人）；无父则按 1 处理以便显示「之X」 */
export function countSiblingsUnderParent(
  person: Pick<Api.Person.Item, 'id'>,
  relations: Api.Relationship.Item[]
): number {
  return listSiblingIds(person.id, relations).length
}

/** @deprecated 使用 countSiblingsUnderParent；保留别名避免外部旧引用断裂 */
export function countSameGenderSiblings(
  person: Pick<Api.Person.Item, 'id' | 'gender'>,
  relations: Api.Relationship.Item[],
  persons?: Pick<Api.Person.Item, 'id' | 'gender'>[]
): number {
  void persons
  return countSiblingsUnderParent(person, relations)
}

/**
 * 在同父/母全体子女中的总排行（1-based）。
 * 优先用出生日期；无日期时用存库排行数字（含「之子」→1）；再按 id。
 */
export function resolveOverallBirthOrder(
  person: Pick<Api.Person.Item, 'id' | 'gender' | 'xingdi' | 'birthDate'>,
  relations: Api.Relationship.Item[],
  persons: Pick<Api.Person.Item, 'id' | 'gender' | 'xingdi' | 'birthDate'>[]
): number | null {
  const siblingIds = listSiblingIds(person.id, relations)
  if (siblingIds.length <= 1) return parseXingdiRank(person.xingdi) || 1

  const byId = new Map(persons.map((p) => [p.id, p]))
  // 列表未载入的同胞也参与占位排序，避免本人被挤到错误位次
  const siblings = siblingIds.map((id) => {
    const hit = byId.get(id)
    if (hit) return hit
    return {
      id,
      gender: 0 as Api.Person.Gender,
      xingdi: id === person.id ? person.xingdi : '',
      birthDate: id === person.id ? person.birthDate : ''
    }
  })

  const sorted = [...siblings].sort((a, b) => {
    const da = (a.birthDate || '').trim()
    const db = (b.birthDate || '').trim()
    if (da && db && da !== db) return da.localeCompare(db)
    if (da && !db) return -1
    if (!da && db) return 1
    const ra = parseXingdiRank(a.xingdi) ?? 999
    const rb = parseXingdiRank(b.xingdi) ?? 999
    if (ra !== rb) return ra - rb
    return a.id - b.id
  })

  const idx = sorted.findIndex((p) => p.id === person.id)
  return idx >= 0 ? idx + 1 : parseXingdiRank(person.xingdi)
}

/** 列表/详情统一展示 */
export function displayXingdi(
  person: Pick<Api.Person.Item, 'id' | 'gender' | 'xingdi' | 'birthDate'>,
  relations: Api.Relationship.Item[],
  persons: Pick<Api.Person.Item, 'id' | 'gender' | 'xingdi' | 'birthDate'>[]
): string {
  if (isXingdiUnknown(person.xingdi)) return '不详'
  const siblingCount = countSiblingsUnderParent(person, relations)
  const overall =
    siblingCount <= 1
      ? parseXingdiRank(person.xingdi) || 1
      : (resolveOverallBirthOrder(person, relations, persons) ??
        parseXingdiRank(person.xingdi) ??
        1)
  // 始终传入数字排行，避免旧存「之子」被原样显示
  return formatXingdiLabel(person.gender, String(overall), siblingCount)
}

/** 添加子女时建议的下一排行数字（同父/母下全体子女最大排行 + 1） */
export function suggestNextXingdiRank(
  parentId: number,
  childGender: Api.Person.Gender,
  relations: Api.Relationship.Item[],
  persons: Pick<Api.Person.Item, 'id' | 'gender' | 'xingdi'>[]
): string {
  void childGender
  const childIds = new Set<number>()
  for (const r of relations) {
    if (r.toPersonId !== parentId) continue
    if (!PARENT_REL_TYPES.includes(r.relType)) continue
    childIds.add(r.fromPersonId)
  }
  let maxRank = 0
  for (const p of persons) {
    if (!childIds.has(p.id)) continue
    const rank = parseXingdiRank(p.xingdi)
    if (rank && rank > maxRank) maxRank = rank
  }
  // 关系里有、档案未进 persons 的同胞也占位，避免建议排行偏小
  if (childIds.size > 0) {
    maxRank = Math.max(maxRank, childIds.size)
  }
  return String(Math.min(12, maxRank + 1))
}
