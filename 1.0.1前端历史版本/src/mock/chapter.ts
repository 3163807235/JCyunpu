/**
 * 谱书章节 Mock
 */

const STORAGE_KEY = 'jcyunpu_mock_chapters'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readAll(): Api.Chapter.Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Api.Chapter.Item[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Api.Chapter.Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId(list: Api.Chapter.Item[]) {
  return list.reduce((max, item) => Math.max(max, item.id), 4000) + 1
}

export const CHAPTER_TYPE_LABELS: Record<Api.Chapter.ChapterType, string> = {
  preface: '谱序',
  fanli: '凡例',
  jiaxun: '家训',
  ciji: '祠记',
  yiwen: '艺文',
  zhuanji: '传记',
  postscript: '后记',
  other: '其他'
}

export async function mockListChapters(genealogyId: number): Promise<Api.Chapter.Item[]> {
  await delay()
  return readAll()
    .filter((c) => c.genealogyId === genealogyId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
}

export async function mockCreateChapter(
  genealogyId: number,
  params: Api.Chapter.FormParams
): Promise<Api.Chapter.Item> {
  await delay()
  if (!params.title?.trim()) throw new Error('请填写章节标题')
  const list = readAll()
  const sameType = list.filter((c) => c.genealogyId === genealogyId)
  const maxSort = sameType.reduce((m, c) => Math.max(m, c.sortOrder), 0)
  const createdAt = nowIso()
  const item: Api.Chapter.Item = {
    id: nextId(list),
    genealogyId,
    chapterType: params.chapterType,
    title: params.title.trim(),
    contentHtml: params.contentHtml || '',
    sortOrder: maxSort + 1,
    createdAt,
    updatedAt: createdAt
  }
  list.push(item)
  writeAll(list)
  return item
}

export async function mockUpdateChapter(
  id: number,
  params: Partial<Api.Chapter.FormParams> & { sortOrder?: number }
): Promise<Api.Chapter.Item> {
  await delay()
  const list = readAll()
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0) throw new Error('章节不存在')
  list[idx] = {
    ...list[idx],
    ...params,
    title: params.title !== undefined ? params.title.trim() : list[idx].title,
    updatedAt: nowIso()
  }
  writeAll(list)
  return list[idx]
}

export async function mockDeleteChapter(id: number): Promise<void> {
  await delay()
  writeAll(readAll().filter((c) => c.id !== id))
}

export async function mockReorderChapters(
  genealogyId: number,
  orderedIds: number[]
): Promise<Api.Chapter.Item[]> {
  await delay()
  const list = readAll()
  orderedIds.forEach((id, index) => {
    const idx = list.findIndex((c) => c.id === id && c.genealogyId === genealogyId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], sortOrder: index + 1, updatedAt: nowIso() }
    }
  })
  writeAll(list)
  return mockListChapters(genealogyId)
}

export function readChaptersSync(genealogyId: number): Api.Chapter.Item[] {
  return readAll()
    .filter((c) => c.genealogyId === genealogyId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}
