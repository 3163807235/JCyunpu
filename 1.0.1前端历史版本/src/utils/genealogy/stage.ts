/**
 * 流程阶段工具 · v3.1.6 五步（§0.6.2）
 * 标准：1启动→2编排→3校对→4智能排版→5归档
 * 简易：1→2→4→5（跳过 3），进度条用 barIndex 映射
 */

export type ProgressSegmentKey = 's1' | 's2' | 's3' | 's4' | 's5'

export interface ProgressSegment {
  key: ProgressSegmentKey
  label: string
  /** 点击跳转的路由 key（对应 /g/:id/:key） */
  routeKey: string
  /** 该段对应的内部阶段（到达判定） */
  requiredStage: Api.Genealogy.Stage
}

/** 将 v2.2.1 六步 stage(1–6) 映射为 v3.1 五步(1–5)；采集中(2)→启动(1) */
export function migrateLegacyStage(oldStage: number): Api.Genealogy.Stage {
  if (oldStage <= 1) return 1
  if (oldStage === 2) return 1
  if (oldStage === 3) return 2
  if (oldStage === 4) return 3
  if (oldStage === 5) return 4
  if (oldStage >= 6) return 5
  return 1
}

/** 标准模式：五步成谱（无「广录族人」段） */
export const STANDARD_PROGRESS: ProgressSegment[] = [
  { key: 's1', label: '壹·立堂定源', routeKey: 'project', requiredStage: 1 },
  { key: 's2', label: '贰·协同编纂', routeKey: 'compose', requiredStage: 2 },
  { key: 's3', label: '叁·三校勘误', routeKey: 'review', requiredStage: 3 },
  { key: 's4', label: '肆·付梓定稿', routeKey: 'layout', requiredStage: 4 },
  { key: 's5', label: '伍·颁谱典藏', routeKey: 'archive', requiredStage: 5 }
]

/** 简易模式：快捷成谱 4 段（跳过校对） */
export const SIMPLE_PROGRESS: ProgressSegment[] = [
  { key: 's1', label: '启动', routeKey: 'project', requiredStage: 1 },
  { key: 's2', label: '编排', routeKey: 'compose', requiredStage: 2 },
  { key: 's3', label: '定稿', routeKey: 'layout', requiredStage: 4 },
  { key: 's4', label: '归档', routeKey: 'archive', requiredStage: 5 }
]

export function getProgressSegments(mode: Api.Genealogy.Mode): ProgressSegment[] {
  return mode === 'simple' ? SIMPLE_PROGRESS : STANDARD_PROGRESS
}

export function getProgressTitle(mode: Api.Genealogy.Mode): string {
  return mode === 'simple' ? '快捷成谱' : '五步成谱'
}

/**
 * current_stage → 进度条高亮段序号（1-based）
 * 简易模式跳过阶段 3，禁止 barIndex = current_stage
 */
export function stageToBarIndex(mode: Api.Genealogy.Mode, stage: Api.Genealogy.Stage): number {
  if (mode === 'standard') return stage
  const map: Partial<Record<Api.Genealogy.Stage, number>> = {
    1: 1,
    2: 2,
    4: 3,
    5: 4
  }
  return map[stage] ?? 1
}

/** 下一内部阶段（简易模式 2→4 跳过校对） */
export function getNextStage(
  mode: Api.Genealogy.Mode,
  current: Api.Genealogy.Stage
): Api.Genealogy.Stage | null {
  if (current >= 5) return null
  if (mode === 'simple' && current === 2) return 4
  return (current + 1) as Api.Genealogy.Stage
}

/** 上一内部阶段（简易模式 4→2） */
export function getPrevStage(
  mode: Api.Genealogy.Mode,
  current: Api.Genealogy.Stage
): Api.Genealogy.Stage | null {
  if (current <= 1) return null
  if (mode === 'simple' && current === 4) return 2
  return (current - 1) as Api.Genealogy.Stage
}

export function stageToRouteKey(mode: Api.Genealogy.Mode, stage: Api.Genealogy.Stage): string {
  const map: Record<Api.Genealogy.Stage, string> = {
    1: 'project',
    2: 'compose',
    3: mode === 'simple' ? 'layout' : 'review',
    4: 'layout',
    5: 'archive'
  }
  return map[stage]
}

export const STAGE_LABELS: Record<Api.Genealogy.Stage, string> = {
  1: '项目启动',
  2: '内容编排',
  3: '校对',
  4: '智能排版',
  5: '发布归档'
}

export const PRIVACY_LABELS: Record<Api.Genealogy.Privacy, string> = {
  1: '完全私有',
  2: '族内可见',
  3: '全网公开'
}
