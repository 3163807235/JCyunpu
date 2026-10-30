/** 族谱成员邀请码格式 · 专题 §6 / §7.1 */
export function isValidInviteCodeFormat(code: string) {
  return /^[A-HJ-NP-Z2-9]{6,16}$/i.test(code.trim())
}

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase()
}
