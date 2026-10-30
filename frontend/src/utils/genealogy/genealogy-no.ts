/**
 * 对外族谱编号（给人看 / 客服报号）
 * 与内部 id、成员邀请码分离；租户内唯一由后端保证
 */

/** 由主键派生稳定展示号：JP-000123（Mock / 旧数据回填） */
export function genealogyNoFromId(id: number): string {
  return `JP-${String(id).padStart(6, '0')}`
}

/** 确保条目有 genealogyNo（不改主键） */
export function ensureGenealogyNo(
  item: Pick<Api.Genealogy.Item, 'id' | 'genealogyNo'>
): string {
  return item.genealogyNo?.trim() || genealogyNoFromId(item.id)
}
