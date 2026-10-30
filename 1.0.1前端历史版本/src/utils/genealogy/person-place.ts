/**
 * 籍贯 / 卒葬地点：省市区选择 + 手动详址 → 合并文本存库
 * 依据：产品文档 §1.7 native_place / burial_place 为文本字段
 */

import { pcaTextArr } from 'element-china-area-data'

export const REGION_OPTIONS = pcaTextArr as { value: string; label: string; children?: any[] }[]

const REGION_SEP = ' '
const DETAIL_SEP = ' · '

/** 合并省市区与详址 */
export function composePlaceText(regionPath: string[], detail: string): string {
  const region = regionPath.filter(Boolean).join(REGION_SEP)
  const extra = detail.trim()
  if (region && extra) return `${region}${DETAIL_SEP}${extra}`
  return region || extra
}

/** 拆分已存地点文本 → 级联路径 + 详址（尽量匹配省市区前缀） */
export function parsePlaceText(stored?: string | null): { regionPath: string[]; detail: string } {
  const raw = (stored || '').trim()
  if (!raw) return { regionPath: [], detail: '' }

  const [head, ...rest] = raw.split(DETAIL_SEP)
  const detailFromSep = rest.join(DETAIL_SEP).trim()

  const matched = matchRegionPath(head.trim())
  if (matched.length) {
    // 头段去掉已匹配省市区后的残余并入详址
    const regionText = matched.join(REGION_SEP)
    let leftover = head.trim()
    if (leftover.startsWith(regionText)) {
      leftover = leftover.slice(regionText.length).trim()
    }
    const detail = [leftover, detailFromSep].filter(Boolean).join(DETAIL_SEP)
    return { regionPath: matched, detail }
  }

  // 无法匹配级联：全部作详址，保留原文本可编辑
  return { regionPath: [], detail: raw }
}

function matchRegionPath(text: string): string[] {
  if (!text) return []
  const path: string[] = []
  let nodes = REGION_OPTIONS as { value: string; label: string; children?: any[] }[]
  let rest = text

  for (let depth = 0; depth < 3; depth++) {
    const hit = nodes.find((n) => rest === n.label || rest.startsWith(n.label))
    if (!hit) break
    path.push(hit.value)
    rest = rest.slice(hit.label.length).trim()
    nodes = (hit.children || []) as typeof nodes
    if (!nodes.length) break
  }
  return path
}
