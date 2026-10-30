declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar
    getLunar(): Lunar
    getYear(): number
    getMonth(): number
    getDay(): number
    toYmd(): string
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar
    getYear(): number
    getMonth(): number
    getDay(): number
    getYearInChinese(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getYearInGanZhi(): string
    getSolar(): Solar
    toString(): string
    toFullString(): string
  }

  export class LunarYear {
    static fromYear(year: number): LunarYear
    getLeapMonth(): number
    getMonths(): LunarMonth[]
  }

  export class LunarMonth {
    getYear(): number
    getMonth(): number
    getDayCount(): number
    getIndex(): number
  }
}

declare module 'element-china-area-data' {
  export const pcaTextArr: { value: string; label: string; children?: any[] }[]
  export const regionData: { value: string; label: string; children?: any[] }[]
  export const codeToText: Record<string, string>
}
