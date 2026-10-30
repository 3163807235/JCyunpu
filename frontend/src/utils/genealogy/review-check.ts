/**
 * 初审检查（本地扫描 Mock）
 */
import { readPersonsSync } from '@/mock/person'
import { readRelationsSync } from '@/mock/relationship'
import { readChaptersSync } from '@/mock/chapter'

export type CheckSeverity = 'error' | 'warn' | 'info'

export interface ReviewCheckItem {
  id: string
  severity: CheckSeverity
  category: 'person' | 'relation' | 'chapter' | 'sensitive'
  title: string
  detail: string
  confirmed?: boolean
}

const SENSITIVE_WORDS = ['反动', '违禁', '色情']

export function runInitialReview(genealogyId: number): ReviewCheckItem[] {
  const persons = readPersonsSync(genealogyId)
  const relations = readRelationsSync(genealogyId)
  const chapters = readChaptersSync(genealogyId)
  const items: ReviewCheckItem[] = []

  persons.forEach((p) => {
    if (!p.nameWei) {
      items.push({
        id: `p-name-${p.id}`,
        severity: 'error',
        category: 'person',
        title: '缺少名讳',
        detail: `人物编号 ${p.personNo}`
      })
    }
    if (!p.birthDate && !p.deathDate) {
      items.push({
        id: `p-date-${p.id}`,
        severity: 'warn',
        category: 'person',
        title: '缺少生卒信息',
        detail: `${p.nameWei || p.personNo}（第${p.generation}世）`
      })
    }
    if (p.zibeiDoubt || p.reviewStatus === 2) {
      items.push({
        id: `p-doubt-${p.id}`,
        severity: 'warn',
        category: 'person',
        title: '字辈存疑',
        detail: `${p.nameWei}：${p.reviewNote || '待复核'}`
      })
    }
    if (p.generation > 1) {
      const hasFather = relations.some(
        (r) =>
          r.toPersonId === p.id &&
          ['father', 'sifu', 'jiantiao', 'jifu', 'yifu'].includes(r.relType)
      )
      if (!hasFather) {
        items.push({
          id: `p-father-${p.id}`,
          severity: 'warn',
          category: 'relation',
          title: '缺少父系关系',
          detail: `${p.nameWei}（第${p.generation}世）未绑定生父/嗣父等`
        })
      }
    }
  })

  chapters.forEach((c) => {
    const text = c.contentHtml.replace(/<[^>]+>/g, '')
    SENSITIVE_WORDS.forEach((word) => {
      if (text.includes(word)) {
        items.push({
          id: `c-sens-${c.id}-${word}`,
          severity: 'error',
          category: 'sensitive',
          title: '敏感词命中',
          detail: `章节「${c.title}」含「${word}」`
        })
      }
    })
    if (!text.trim()) {
      items.push({
        id: `c-empty-${c.id}`,
        severity: 'info',
        category: 'chapter',
        title: '章节正文为空',
        detail: c.title
      })
    }
  })

  if (!persons.length) {
    items.push({
      id: 'empty-persons',
      severity: 'error',
      category: 'person',
      title: '尚未录入人物',
      detail: '请先在信息管理中新增人物'
    })
  }

  return items
}
