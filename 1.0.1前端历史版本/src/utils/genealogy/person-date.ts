/**
 * 生卒日期：阳历 ⇄ 农历双向转换 + 纪年文本
 * 存库格式：阳历YYYY-MM-DD｜纪年农历文案
 * 依据：产品文档 §1.7 birth_date 支持农历/公历文本
 */

import { Lunar, LunarYear, Solar } from 'lunar-javascript'

/** 清代年号（起止按农历年近似对照） */
const QING_ERAS: { name: string; start: number; end: number }[] = [
  { name: '清宣统', start: 1909, end: 1911 },
  { name: '清光绪', start: 1875, end: 1908 },
  { name: '清同治', start: 1862, end: 1874 },
  { name: '清咸丰', start: 1851, end: 1861 },
  { name: '清道光', start: 1821, end: 1850 },
  { name: '清嘉庆', start: 1796, end: 1820 },
  { name: '清乾隆', start: 1736, end: 1795 },
  { name: '清雍正', start: 1723, end: 1735 },
  { name: '清康熙', start: 1662, end: 1722 },
  { name: '清顺治', start: 1644, end: 1661 }
]

const CN_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 存库分隔符：阳历ISO｜纪年农历 */
export const DATE_STORE_SEP = '｜'

export type SolarParts = { year: number; month: number; day: number }

/** 农历部件；month 为负表示闰月（如 -4 = 闰四月） */
export type LunarParts = { year: number; month: number; day: number }

export type DatePartsPair = {
  solar: SolarParts
  lunar: LunarParts
  solarIso: string
  eraLunarText: string
}

/** 数字转中文年份 */
export function toChineseYearNumber(n: number): string {
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
    .split('')
    .map((ch) => CN_DIGITS[Number(ch)] ?? ch)
    .join('')
}

export function formatEraPrefix(lunarYear: number): string {
  if (lunarYear >= 1949) {
    return `公元${toChineseYearNumber(lunarYear)}年`
  }
  if (lunarYear >= 1912) {
    return `民国${toChineseYearNumber(lunarYear - 1911)}年`
  }
  const era = QING_ERAS.find((e) => lunarYear >= e.start && lunarYear <= e.end)
  if (era) {
    return `${era.name}${toChineseYearNumber(lunarYear - era.start + 1)}年`
  }
  return `公元${toChineseYearNumber(lunarYear)}年`
}

export function parseIsoDate(iso?: string | null): SolarParts | null {
  if (!iso) return null
  const m = iso.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month, day }
}

export function toSolarIso(parts: SolarParts): string {
  const mm = String(parts.month).padStart(2, '0')
  const dd = String(parts.day).padStart(2, '0')
  return `${parts.year}-${mm}-${dd}`
}

/** 农历 → 纪年农历展示文案 */
export function formatEraLunarFromLunar(lunar: LunarParts): string {
  const lunarObj = Lunar.fromYmd(lunar.year, lunar.month, lunar.day)
  const lunarYear = lunarObj.getYear()
  const era = formatEraPrefix(lunarYear)
  const ganzhi = lunarObj.getYearInGanZhi()
  const monthCn = `${lunarObj.getMonthInChinese()}月`
  const dayCn = lunarObj.getDayInChinese()

  if (lunarYear >= 1949) {
    return `${era}农历${ganzhi}年${monthCn}${dayCn}`
  }
  return `${era}${ganzhi}${monthCn}${dayCn}`
}

export function formatEraLunarDate(parts: SolarParts): string {
  const lunar = solarToLunar(parts)
  return formatEraLunarFromLunar(lunar)
}

export function formatEraLunarFromIso(iso: string): string {
  const parts = parseIsoDate(iso)
  if (!parts) return ''
  return formatEraLunarDate(parts)
}

/** 阳历 → 农历 */
export function solarToLunar(solar: SolarParts): LunarParts {
  const lunar = Solar.fromYmd(solar.year, solar.month, solar.day).getLunar()
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay()
  }
}

/** 农历 → 阳历 */
export function lunarToSolar(lunar: LunarParts): SolarParts {
  const solar = Lunar.fromYmd(lunar.year, lunar.month, lunar.day).getSolar()
  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay()
  }
}

export function buildDatePartsFromSolar(solar: SolarParts): DatePartsPair {
  const lunar = solarToLunar(solar)
  return {
    solar,
    lunar,
    solarIso: toSolarIso(solar),
    eraLunarText: formatEraLunarFromLunar(lunar)
  }
}

export function buildDatePartsFromLunar(lunar: LunarParts): DatePartsPair {
  const solar = lunarToSolar(lunar)
  return {
    solar,
    lunar,
    solarIso: toSolarIso(solar),
    eraLunarText: formatEraLunarFromLunar(lunar)
  }
}

/** 合并存库：阳历ISO｜纪年农历 */
export function composeStoredDate(pair: DatePartsPair): string {
  return `${pair.solarIso}${DATE_STORE_SEP}${pair.eraLunarText}`
}

/** 解析存库文本 → 阳历/农历部件（兼容旧纯文本） */
export function parseStoredDate(stored?: string | null): Partial<DatePartsPair> & {
  displayText: string
} {
  const raw = (stored || '').trim()
  if (!raw) return { displayText: '' }
  if (raw === DATE_UNKNOWN_TEXT || raw === '生年未详' || raw === '卒年未详') {
    return { displayText: raw }
  }

  if (raw.includes(DATE_STORE_SEP)) {
    const [isoPart, ...rest] = raw.split(DATE_STORE_SEP)
    const eraLunarText = rest.join(DATE_STORE_SEP).trim()
    const solar = parseIsoDate(isoPart.trim())
    if (solar) {
      const pair = buildDatePartsFromSolar(solar)
      return {
        ...pair,
        eraLunarText: eraLunarText || pair.eraLunarText,
        displayText: composeStoredDate({
          ...pair,
          eraLunarText: eraLunarText || pair.eraLunarText
        })
      }
    }
  }

  const solarOnly = parseIsoDate(raw)
  if (solarOnly) {
    const pair = buildDatePartsFromSolar(solarOnly)
    return { ...pair, displayText: composeStoredDate(pair) }
  }

  // 旧纪年农历纯文本：无法可靠反解，仅展示
  return { displayText: raw }
}

export function tryExtractIsoFromStored(stored?: string | null): string {
  return parseStoredDate(stored).solarIso || ''
}

/** 某农历年的月份选项（含闰月，month 负数为闰） */
export function getLunarMonthOptions(year: number): { value: number; label: string }[] {
  try {
    const months = LunarYear.fromYear(year)
      .getMonths()
      .filter((m) => m.getYear() === year)
    return months.map((m) => {
      const value = m.getMonth()
      const sample = Lunar.fromYmd(year, value, 1)
      return {
        value,
        label: `${sample.getMonthInChinese()}月`
      }
    })
  } catch {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}月`
    }))
  }
}

/** 某农历年月的天数 */
export function getLunarDayCount(year: number, month: number): number {
  try {
    const hit = LunarYear.fromYear(year)
      .getMonths()
      .find((m) => m.getYear() === year && m.getMonth() === month)
    return hit?.getDayCount() || 30
  } catch {
    return 30
  }
}

export function getLunarDayOptions(year: number, month: number): { value: number; label: string }[] {
  const count = getLunarDayCount(year, month)
  return Array.from({ length: count }, (_, i) => {
    const day = i + 1
    try {
      const label = Lunar.fromYmd(year, month, day).getDayInChinese()
      return { value: day, label }
    } catch {
      return { value: day, label: String(day) }
    }
  })
}

/** 农历年份下拉范围（谱牒常用） */
export const LUNAR_YEAR_MIN = 1644
export const LUNAR_YEAR_MAX = 2100

export function getLunarYearOptions(): { value: number; label: string }[] {
  const list: { value: number; label: string }[] = []
  for (let y = LUNAR_YEAR_MAX; y >= LUNAR_YEAR_MIN; y--) {
    list.push({ value: y, label: `${y}` })
  }
  return list
}

export const DATE_UNKNOWN_TEXT = '生卒未详'
