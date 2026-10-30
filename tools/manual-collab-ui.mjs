/**
 * 协作角色管理 · 页面级冒烟（Playwright）
 * 前置：前端 http://127.0.0.1:3006 、后端 :8080
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.UI_BASE || 'http://127.0.0.1:3006'
const API = process.env.API_BASE || 'http://127.0.0.1:8080'
const OWNER_PHONE = process.env.OWNER_PHONE || '13900001122'
const EDITOR_PHONE = process.env.EDITOR_PHONE || '13900002233'
const PASSWORD = 'pass1234'
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.manual-collab-ui')

async function api(method, url, { token, body } = {}) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const json = await res.json()
  if (json.code !== 200) {
    throw new Error(`${method} ${url} => ${json.code} ${json.msg}`)
  }
  return json.data
}

async function ensureUser(phone) {
  try {
    await api('POST', '/api/auth/sms/send', { body: { phone, scene: 'register' } })
    await api('POST', '/api/auth/register', {
      body: { phone, smsCode: '123456', password: PASSWORD }
    })
  } catch {
    /* already registered */
  }
  const data = await api('POST', '/api/auth/login', {
    body: { phone, password: PASSWORD, loginType: 'password' }
  })
  return { token: data.token, refreshToken: data.refreshToken || '' }
}

async function ensureGenealogy(token) {
  const page = await api('GET', '/api/genealogy/list?current=1&size=10', { token })
  const owned = (page.records || []).find((g) => g.membership === 'owner')
  if (owned) return owned.id
  const created = await api('POST', '/api/genealogy', {
    token,
    body: { name: '协作UI验收谱', surname: '李', privacy: 1, mode: 'standard' }
  })
  return created.id
}

function shot(page, name) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  return page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true })
}

async function main() {
  console.log('[1] 准备账号与族谱…')
  await ensureUser(EDITOR_PHONE)
  const ownerAuth = await ensureUser(OWNER_PHONE)
  const info = await api('GET', '/api/user/info', { token: ownerAuth.token })
  const genealogyId = await ensureGenealogy(ownerAuth.token)
  console.log(`    owner=${info.userId || info.id} genealogyId=${genealogyId}`)

  // 清理旧协作（可重复跑）
  const list0 = await api('GET', `/api/genealogy/${genealogyId}/collaborators`, {
    token: ownerAuth.token
  })
  for (const c of list0.list || []) {
    if (c.role !== 'owner' && (c.inviteStatus === 0 || c.inviteStatus === 1)) {
      await api('DELETE', `/api/genealogy/${genealogyId}/collaborators/${c.userId}`, {
        token: ownerAuth.token
      })
    }
  }

  console.log('[2] 打开浏览器注入登录态…')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const apiErrors = []
  page.on('response', async (res) => {
    try {
      if (!res.url().includes('/api/')) return
      if (res.status() >= 400) {
        apiErrors.push(`${res.status()} ${res.url()}`)
      }
      const ct = res.headers()['content-type'] || ''
      if (ct.includes('application/json') && res.url().includes('/collaborators')) {
        const body = await res.json().catch(() => null)
        if (body && body.code && body.code !== 200) {
          apiErrors.push(`biz ${body.code} ${body.msg} ${res.url()}`)
        }
      }
    } catch {
      /* ignore */
    }
  })

  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ({ token, refreshToken, info }) => {
      const key = 'sys-v3.0.2-user'
      const state = {
        language: 'zh',
        isLogin: true,
        isLock: false,
        lockPassword: '',
        info,
        searchHistory: [],
        accessToken: token,
        refreshToken: refreshToken || ''
      }
      localStorage.setItem(key, JSON.stringify(state))
      localStorage.setItem('sys-last-user-id', String(info.userId || info.id || ''))
      localStorage.setItem('sys-version', '3.0.2')
    },
    { token: ownerAuth.token, refreshToken: ownerAuth.refreshToken, info }
  )

  // 前端为 hash 路由；深链可能被守卫打回 overview，改为菜单进入
  const overviewUrl = `${BASE}/#/g/${genealogyId}/overview`
  console.log(`[3] 进入族谱空间再点开角色管理 ${overviewUrl}`)
  await page.goto(overviewUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  console.log(`    url=${page.url()}`)
  await shot(page, '01-overview')

  if (page.url().includes('/auth/login') || page.url().includes('/login')) {
    await shot(page, '01-kicked-login')
    throw new Error('注入登录态失败，被重定向到登录页')
  }

  // 侧栏：权限管理 → 角色管理
  const settingsMenu = page.getByText('权限管理', { exact: true }).first()
  await settingsMenu.waitFor({ timeout: 15000 })
  await settingsMenu.click()
  await page.waitForTimeout(500)
  const rolesMenu = page.getByText('角色管理', { exact: true }).first()
  await rolesMenu.click()
  await page.waitForTimeout(1500)
  console.log(`    url after menu=${page.url()}`)
  await shot(page, '02-roles-via-menu')

  const seat = page.getByText('协作席位').first()
  try {
    await seat.waitFor({ timeout: 20000 })
  } catch (e) {
    await shot(page, '02-no-seat')
    const bodyText = await page.locator('body').innerText().catch(() => '')
    console.log(`    bodyPreview=${bodyText.slice(0, 300).replace(/\s+/g, ' ')}`)
    throw e
  }
  await shot(page, '02-roles-loaded')
  const seatText = await page.locator('text=协作席位').first().locator('..').innerText()
  console.log(`    ${seatText.replace(/\s+/g, ' ')}`)

  console.log('[4] 邀请采编…')
  await page.getByRole('button', { name: '邀请采编' }).click()
  await page.getByPlaceholder('被邀请人 11 位手机号').fill(EDITOR_PHONE)
  await page.getByPlaceholder('可选，默认「采编·后四位」').fill('UI采编甲')
  await shot(page, '03-invite-dialog')
  await page.getByRole('button', { name: '发送邀请' }).click()
  await page.waitForTimeout(1200)
  await shot(page, '04-after-invite')

  const pending = page.getByText('待接受').first()
  await pending.waitFor({ timeout: 10000 })
  console.log('    列表出现「待接受」')

  console.log('[5] 拥有者确认接受…')
  await page.getByRole('button', { name: '模拟接受' }).click()
  await page.waitForTimeout(1200)
  await shot(page, '05-after-accept')
  await page.getByText('已加入').first().waitFor({ timeout: 10000 })
  console.log('    状态变为「已加入」')

  console.log('[6] 移除协作…')
  page.once('dialog', async (d) => d.accept())
  // Element Plus MessageBox 不是原生 dialog
  await page.getByRole('button', { name: '移除' }).first().click()
  await page.waitForTimeout(400)
  const confirmBtn = page.getByRole('button', { name: '移除' }).last()
  if (await confirmBtn.count()) {
    await confirmBtn.click()
  }
  await page.waitForTimeout(1200)
  await shot(page, '06-after-remove')

  // 待接受/已加入的采编行应消失（或变为已移除不展示）
  const editorRow = page.getByText('UI采编甲')
  const stillVisible = (await editorRow.count()) > 0
  console.log(`    采编行仍可见=${stillVisible}（期望 false）`)

  const seatAfter = await page.locator('text=协作席位').first().locator('..').innerText()
  console.log(`    ${seatAfter.replace(/\s+/g, ' ')}`)

  await browser.close()

  if (apiErrors.length) {
    console.log('[!] 捕获到 API 异常:')
    for (const e of apiErrors) console.log('   ', e)
    process.exitCode = 1
    return
  }
  if (stillVisible) {
    console.error('[FAIL] 移除后采编仍在列表')
    process.exitCode = 1
    return
  }
  console.log('[OK] 页面级协作冒烟通过')
  console.log(`截图目录: ${OUT_DIR}`)
}

main().catch(async (err) => {
  console.error('[FAIL]', err.message || err)
  process.exitCode = 1
})
