/**
 * 人物批量导入模板 · 产品文档 v3.1.6 §1.10.1
 * 列头固定不可改；第 2 行为填写说明（导入跳过）；第 3 行起为正式数据。
 * 样式用 xlsx-js-style（社区版 xlsx 无法写出填充色）。
 */
import * as XLSX from 'xlsx'
// ESM 下为 default 导出（CJS 打包），与社区版 xlsx API 兼容且支持单元格样式
import XLSXStyle from 'xlsx-js-style'

/** 与文档列序 A–Q 一一对应的固定列头 */
export const PERSON_IMPORT_HEADERS = [
  '人物编号',
  '世代',
  '讳(本名)',
  '字',
  '号',
  '字辈',
  '性别',
  '出生日期',
  '死亡日期',
  '是否在世',
  '籍贯',
  '墓葬地',
  '传纪',
  '生父编号',
  '生母编号',
  '配偶编号',
  '行第(排行)'
] as const

export type PersonImportHeader = (typeof PERSON_IMPORT_HEADERS)[number]

/** 必填列（§1.10.1） */
export const PERSON_IMPORT_REQUIRED_HEADERS: ReadonlySet<PersonImportHeader> = new Set([
  '人物编号',
  '世代',
  '性别',
  '是否在世'
])

/** 列头批注 + 第 2 行说明文案 */
const HEADER_META: Record<
  PersonImportHeader,
  { required: boolean; comment: string; hint: string }
> = {
  人物编号: {
    required: true,
    comment: '【必填】项目内唯一，字母+数字，如 P001。用于跨行关联亲属。',
    hint: '※说明行·请从第3行填写｜必填·如P001'
  },
  世代: {
    required: true,
    comment: '【必填】正整数 1–99，始祖为 1。',
    hint: '必填·正整数1-99'
  },
  '讳(本名)': {
    required: false,
    comment: '【选填】本名，≤32 字。',
    hint: '选填·≤32字'
  },
  字: {
    required: false,
    comment: '【选填】字，≤32 字。',
    hint: '选填·≤32字'
  },
  号: {
    required: false,
    comment: '【选填】号，≤64 字。',
    hint: '选填·≤64字'
  },
  字辈: {
    required: false,
    comment: '【选填】单字，需匹配字辈诗；不匹配可导入并标存疑。',
    hint: '选填·单字'
  },
  性别: {
    required: true,
    comment: '【必填】男 / 女 / 未知。',
    hint: '必填·男/女/未知'
  },
  出生日期: {
    required: false,
    comment: '【选填】支持公历如 1950-03-15，或农历文本。',
    hint: '选填·如1950-03-15'
  },
  死亡日期: {
    required: false,
    comment: '【选填】格式同出生日期；有卒日将按已故处理。',
    hint: '选填·格式同出生'
  },
  是否在世: {
    required: true,
    comment: '【必填】是 / 否。',
    hint: '必填·是/否'
  },
  籍贯: {
    required: false,
    comment: '【选填】≤128 字。',
    hint: '选填·≤128字'
  },
  墓葬地: {
    required: false,
    comment: '【选填】≤256 字。',
    hint: '选填·≤256字'
  },
  传纪: {
    required: false,
    comment: '【选填】≤2000 字。',
    hint: '选填·≤2000字'
  },
  生父编号: {
    required: false,
    comment: '【选填】引用本表「人物编号」，如 P001。',
    hint: '选填·引用人物编号'
  },
  生母编号: {
    required: false,
    comment: '【选填】引用本表「人物编号」。',
    hint: '选填·引用人物编号'
  },
  配偶编号: {
    required: false,
    comment: '【选填】引用本表「人物编号」，多人用逗号分隔。',
    hint: '选填·多人用逗号分隔'
  },
  '行第(排行)': {
    required: false,
    comment: '【选填】如「长子」「三女」，≤32 字。',
    hint: '选填·如长子/三女'
  }
}

/** 说明行标记前缀：第 2 行带此特征则跳过；用户整行改成真实数据后可导入 */
export const PERSON_IMPORT_HINT_MARK = '※说明行'

const SAMPLE_PERSON_NO = 'P001'

/** 兼容旧模板示例行 */
export const PERSON_IMPORT_SAMPLE: Record<PersonImportHeader, string | number> = {
  人物编号: SAMPLE_PERSON_NO,
  世代: 1,
  '讳(本名)': '某某',
  字: '',
  号: '',
  字辈: '德',
  性别: '男',
  出生日期: '1950-03-15',
  死亡日期: '',
  是否在世: '是',
  籍贯: '某某省某某县',
  墓葬地: '',
  传纪: '（示例行，导入前请删除或留空后从第3行填写）',
  生父编号: '',
  生母编号: '',
  配偶编号: '',
  '行第(排行)': '1'
}

/** 解析后的导入行（含关系引用，供入库二次挂边） */
export interface PersonImportRow {
  personNo: string
  form: Api.Person.FormParams
  fatherNo?: string
  motherNo?: string
  spouseNos: string[]
  /** Excel 行号（含表头，从 1 计） */
  excelRow: number
}

export interface PersonImportParseResult {
  rows: PersonImportRow[]
  /** 列头/空文件等硬错误 */
  fatalErrors: string[]
  /** 行级跳过原因 */
  rowErrors: string[]
}

const MAX_IMPORT_ROWS = 1000

type StyleCell = {
  v?: string | number
  t?: string
  s?: Record<string, unknown>
  c?: Array<{ a?: string; t?: string }>
}

const STYLE = {
  headerRequired: {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { patternType: 'solid', fgColor: { rgb: 'C65911' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder()
  },
  headerOptional: {
    font: { bold: true, color: { rgb: '1F4E79' }, sz: 11 },
    fill: { patternType: 'solid', fgColor: { rgb: 'DDEBF7' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder()
  },
  hintRequired: {
    font: { color: { rgb: '833C0C' }, sz: 10, italic: true },
    fill: { patternType: 'solid', fgColor: { rgb: 'FCE4D6' } },
    alignment: { vertical: 'center', wrapText: true },
    border: thinBorder()
  },
  hintOptional: {
    font: { color: { rgb: '5B5B5B' }, sz: 10, italic: true },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFF2CC' } },
    alignment: { vertical: 'center', wrapText: true },
    border: thinBorder()
  },
  dataRequired: {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFF2CC' } },
    border: thinBorder()
  },
  dataOptional: {
    border: thinBorder()
  },
  guideTitle: {
    font: { bold: true, sz: 14, color: { rgb: 'C65911' } },
    alignment: { vertical: 'center' }
  },
  guideBody: {
    font: { sz: 11 },
    alignment: { vertical: 'center', wrapText: true }
  }
}

function thinBorder() {
  const side = { style: 'thin', color: { rgb: 'B4B4B4' } }
  return { top: side, bottom: side, left: side, right: side }
}

function colLetter(index: number) {
  let n = index
  let s = ''
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

function cellStr(row: Record<string, unknown>, key: string): string {
  const v = row[key]
  if (v == null) return ''
  return String(v).trim()
}

function parseGender(raw: string): Api.Person.Gender | null {
  if (raw === '男' || raw === '1') return 1
  if (raw === '女' || raw === '2') return 2
  if (raw === '未知' || raw === '0') return 0
  return null
}

function parseAlive(raw: string): 0 | 1 | null {
  if (raw === '是' || raw === '1' || raw === '在世') return 1
  if (raw === '否' || raw === '0' || raw === '已故') return 0
  return null
}

/** 第 2 行说明 / 旧版示例：跳过；用户整行改成真实数据则导入 */
function isSkipTemplateRow(row: Record<string, unknown>, excelRow: number): boolean {
  const no = cellStr(row, '人物编号')
  const tip = cellStr(row, '传纪')
  const joined = PERSON_IMPORT_HEADERS.map((h) => cellStr(row, h)).join(' ')

  if (no.includes(PERSON_IMPORT_HINT_MARK) || joined.includes(PERSON_IMPORT_HINT_MARK)) return true
  if (no.startsWith('※') || tip.includes('示例行') || tip.includes('说明行')) return true
  // 旧模板：原样示例编号且仍像示例
  if (excelRow === 2 && no === SAMPLE_PERSON_NO && tip.includes('示例')) return true
  if (excelRow === 2 && no === SAMPLE_PERSON_NO && !cellStr(row, '讳(本名)')) return true
  return false
}

function buildGuideSheet() {
  const lines: StyleCell[][] = [
    [{ v: '家传云谱 · 人物批量导入填写说明', t: 's', s: STYLE.guideTitle }],
    [{ v: '', t: 's' }],
    [
      {
        v: '1. 第 1 行是固定列头，请勿改名、删列或调换顺序。',
        t: 's',
        s: STYLE.guideBody
      }
    ],
    [
      {
        v: '2. 第 2 行是「填写说明行」（黄底斜体），仅作格式提示，导入时会自动跳过，请勿在此行填写正式人物。',
        t: 's',
        s: STYLE.guideBody
      }
    ],
    [
      {
        v: '3. 请从第 3 行开始录入正式数据。橙色表头 = 必填；浅蓝表头 = 选填。鼠标悬停列头可看批注。',
        t: 's',
        s: STYLE.guideBody
      }
    ],
    [
      {
        v: '4. 必填项：人物编号、世代、性别、是否在世。亲属编号须引用本表已有「人物编号」。',
        t: 's',
        s: STYLE.guideBody
      }
    ],
    [
      {
        v: '5. 单次最多 1000 行；若误在第 2 行填了真实数据且已去掉「※说明行」字样，系统会按正式数据导入。',
        t: 's',
        s: STYLE.guideBody
      }
    ],
    [{ v: '', t: 's' }],
    [{ v: '颜色图例', t: 's', s: { font: { bold: true, sz: 12 } } }],
    [
      {
        v: '橙色表头',
        t: 's',
        s: STYLE.headerRequired
      },
      { v: '必填列', t: 's', s: STYLE.guideBody }
    ],
    [
      {
        v: '浅蓝表头',
        t: 's',
        s: STYLE.headerOptional
      },
      { v: '选填列', t: 's', s: STYLE.guideBody }
    ],
    [
      {
        v: '黄底说明',
        t: 's',
        s: STYLE.hintOptional
      },
      { v: '第 2 行填写说明（勿填正式数据）', t: 's', s: STYLE.guideBody }
    ]
  ]

  const sheet: XLSX.WorkSheet = {}
  lines.forEach((row, r) => {
    row.forEach((cell, c) => {
      sheet[`${colLetter(c)}${r + 1}`] = cell
    })
  })
  sheet['!ref'] = `A1:B${lines.length}`
  sheet['!cols'] = [{ wch: 18 }, { wch: 72 }]
  sheet['!rows'] = lines.map((_, i) => ({ hpt: i === 0 ? 24 : 18 }))
  return sheet
}

/** 生成可下载的标准模板工作簿（含样式与说明页） */
export function buildPersonImportTemplateWorkbook(): XLSX.WorkBook {
  const sheet: XLSX.WorkSheet = {}
  const colCount = PERSON_IMPORT_HEADERS.length
  // 预置第 3–12 行空白录入区，必填列浅黄底提示「从这里写」
  const dataPreviewRows = 10
  const totalRows = 2 + dataPreviewRows

  PERSON_IMPORT_HEADERS.forEach((header, c) => {
    const meta = HEADER_META[header]
    const col = colLetter(c)

    const comments = [{ a: '家传云谱', t: meta.comment }] as Array<{
      a?: string
      t?: string
    }> & { hidden?: boolean }
    comments.hidden = true
    const headerCell: StyleCell = {
      v: header,
      t: 's',
      s: meta.required ? STYLE.headerRequired : STYLE.headerOptional,
      c: comments
    }
    sheet[`${col}1`] = headerCell

    const hintCell: StyleCell = {
      v: meta.hint,
      t: 's',
      s: meta.required ? STYLE.hintRequired : STYLE.hintOptional
    }
    sheet[`${col}2`] = hintCell

    for (let r = 3; r <= totalRows; r++) {
      sheet[`${col}${r}`] = {
        v: '',
        t: 's',
        s: meta.required ? STYLE.dataRequired : STYLE.dataOptional
      }
    }
  })

  sheet['!ref'] = `A1:${colLetter(colCount - 1)}${totalRows}`
  sheet['!cols'] = PERSON_IMPORT_HEADERS.map((h) => ({
    wch: Math.max(12, Math.min(22, h.length * 2 + 4))
  }))
  sheet['!rows'] = [
    { hpt: 28 },
    { hpt: 36 },
    ...Array.from({ length: dataPreviewRows }, () => ({ hpt: 20 }))
  ]
  // 冻结首行，方便向下填写时对照列头
  ;(sheet as XLSX.WorkSheet & { '!views'?: unknown[] })['!views'] = [
    { state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A3' }
  ]

  const wb = XLSXStyle.utils.book_new()
  XLSXStyle.utils.book_append_sheet(wb, sheet, '人物导入')
  XLSXStyle.utils.book_append_sheet(wb, buildGuideSheet(), '填写说明')
  return wb
}

/** 浏览器下载标准模板 */
export function downloadPersonImportTemplate(filename = '家传云谱-人物批量导入模板.xlsx') {
  const wb = buildPersonImportTemplateWorkbook()
  XLSXStyle.writeFile(wb, filename)
}

/**
 * 校验列头是否与模板一致（允许多余列，但必备列必须存在且同名）
 */
export function validatePersonImportHeaders(headers: string[]): string[] {
  const set = new Set(headers.map((h) => h.trim()).filter(Boolean))
  const missing = PERSON_IMPORT_HEADERS.filter((h) => !set.has(h))
  if (!missing.length) return []
  return [`缺少固定列头：${missing.join('、')}。请先下载标准模板填写后再导入。`]
}

/** 从已读入的工作簿解析导入行 */
export function parsePersonImportWorkbook(wb: XLSX.WorkBook): PersonImportParseResult {
  const fatalErrors: string[] = []
  const rowErrors: string[] = []
  const rows: PersonImportRow[] = []

  if (!wb.SheetNames.length) {
    return { rows, fatalErrors: ['文件无工作表'], rowErrors }
  }

  // 优先取「人物导入」页，兼容仅一页的旧文件
  const sheetName =
    wb.SheetNames.find((n) => n === '人物导入') ||
    wb.SheetNames.find((n) => n !== '填写说明') ||
    wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false
  })

  if (!rawRows.length) {
    return { rows, fatalErrors: ['文件无数据行'], rowErrors }
  }

  const headers = Object.keys(rawRows[0] || {})
  const headerErrs = validatePersonImportHeaders(headers)
  if (headerErrs.length) {
    return { rows, fatalErrors: headerErrs, rowErrors }
  }

  const seenNos = new Set<string>()
  let dataCount = 0

  rawRows.forEach((raw, idx) => {
    const excelRow = idx + 2 // 表头第1行 + sheet_to_json 从第2行起
    if (isSkipTemplateRow(raw, excelRow)) return

    const personNo = cellStr(raw, '人物编号')
    const nameWei = cellStr(raw, '讳(本名)')
    const genRaw = cellStr(raw, '世代')
    const genderRaw = cellStr(raw, '性别')
    const aliveRaw = cellStr(raw, '是否在世')

    // 整行空则跳过（含预置空白录入区）
    const any =
      personNo || nameWei || genRaw || genderRaw || cellStr(raw, '字') || cellStr(raw, '字辈')
    if (!any) return

    // 说明文案残留（未清空第2行就改了一部分）仍跳过
    if (
      personNo.includes('必填') ||
      personNo.includes('选填') ||
      genRaw.includes('必填') ||
      genderRaw.includes('必填')
    ) {
      rowErrors.push(`第${excelRow}行：仍为填写说明内容，请清空后从第 3 行填写正式数据`)
      return
    }

    dataCount++
    if (dataCount > MAX_IMPORT_ROWS) {
      rowErrors.push(`第${excelRow}行：超过单次上限 ${MAX_IMPORT_ROWS} 行，已跳过`)
      return
    }

    if (!personNo) {
      rowErrors.push(`第${excelRow}行：人物编号必填`)
      return
    }
    if (seenNos.has(personNo)) {
      rowErrors.push(`第${excelRow}行：人物编号「${personNo}」重复，已跳过`)
      return
    }
    seenNos.add(personNo)

    const generation = Number(genRaw)
    if (!Number.isFinite(generation) || generation < 1 || generation > 99) {
      rowErrors.push(`第${excelRow}行：世代须为 1–99 的正整数`)
      return
    }

    const gender = parseGender(genderRaw)
    if (gender == null) {
      rowErrors.push(`第${excelRow}行：性别须为「男 / 女 / 未知」`)
      return
    }

    let isAlive = parseAlive(aliveRaw)
    if (isAlive == null) {
      rowErrors.push(`第${excelRow}行：是否在世须为「是 / 否」`)
      return
    }

    const deathDate = cellStr(raw, '死亡日期')
    if (deathDate && isAlive === 1) {
      isAlive = 0
    }

    const spouseRaw = cellStr(raw, '配偶编号')
    const spouseNos = spouseRaw
      ? spouseRaw
          .split(/[,，;；、\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    rows.push({
      personNo,
      excelRow,
      fatherNo: cellStr(raw, '生父编号') || undefined,
      motherNo: cellStr(raw, '生母编号') || undefined,
      spouseNos,
      form: {
        nameWei: nameWei || personNo,
        nameZi: cellStr(raw, '字'),
        nameHao: cellStr(raw, '号'),
        zibei: cellStr(raw, '字辈'),
        xingdi: cellStr(raw, '行第(排行)'),
        generation,
        gender,
        birthDate: cellStr(raw, '出生日期'),
        deathDate,
        isAlive,
        nativePlace: cellStr(raw, '籍贯'),
        burialPlace: cellStr(raw, '墓葬地'),
        biography: cellStr(raw, '传纪'),
        privacyLevel: 2
      }
    })
  })

  // §1.10.1：引用编号须在本批次存在；性别与关系冲突整行跳过
  const byNo = new Map(rows.map((r) => [r.personNo, r]))
  const accepted: PersonImportRow[] = []
  for (const row of rows) {
    const fail = (msg: string) => {
      rowErrors.push(`第${row.excelRow}行：${msg}`)
    }

    if (row.fatherNo) {
      const father = byNo.get(row.fatherNo)
      if (!father) {
        fail(`生父编号「${row.fatherNo}」不在本批次`)
        continue
      }
      if (father.form.gender === 2) {
        fail('生父性别为女，关系冲突')
        continue
      }
    }
    if (row.motherNo) {
      const mother = byNo.get(row.motherNo)
      if (!mother) {
        fail(`生母编号「${row.motherNo}」不在本批次`)
        continue
      }
      if (mother.form.gender === 1) {
        fail('生母性别为男，关系冲突')
        continue
      }
    }
    let spouseOk = true
    for (const sn of row.spouseNos) {
      if (!byNo.has(sn)) {
        fail(`配偶编号「${sn}」不在本批次`)
        spouseOk = false
        break
      }
      if (sn === row.personNo) {
        fail('配偶编号不能指向本人')
        spouseOk = false
        break
      }
    }
    if (!spouseOk) continue

    accepted.push(row)
  }

  if (!accepted.length && !rowErrors.length) {
    fatalErrors.push('无有效数据行。请从第 3 行起填写（第 2 行为说明行，勿填正式数据）。')
  }

  return { rows: accepted, fatalErrors, rowErrors }
}

/** 校验报告行（§1.10.1 错误反馈） */
export interface PersonImportReportLine {
  status: '成功' | '错误' | '存疑'
  message: string
}

/** 下载导入校验报告 Excel */
export function downloadPersonImportReport(
  lines: PersonImportReportLine[],
  summary: { success: number; failed: number; skipped: number },
  filename = '家传云谱-人物导入校验报告.xlsx'
) {
  const aoa: (string | number)[][] = [
    ['导入结果摘要'],
    ['成功', summary.success],
    ['失败', summary.failed],
    ['解析跳过', summary.skipped],
    [],
    ['状态', '说明'],
    ...lines.map((l) => [l.status, l.message])
  ]
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  sheet['!cols'] = [{ wch: 10 }, { wch: 72 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, '校验报告')
  XLSX.writeFile(wb, filename)
}
