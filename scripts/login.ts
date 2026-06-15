#!/usr/bin/env tsx
/**
 * Bilibili QR 码登录脚本
 *
 * 通过手机 B 站 App 扫码登录，自动提取 Cookie 凭据并输出 .env 格式。
 *
 * 用法:
 *   npx tsx scripts/login.ts                  # 手动复制输出
 *   npx tsx scripts/login.ts --write          # 自动写入 .env
 *   npx tsx scripts/login.ts --help           # 查看帮助
 *
 * 依赖:
 *   - axios
 *   - qrcode （终端显示二维码）
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import axios, { type AxiosResponse } from 'axios'
import QRCode from 'qrcode'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const ENV_PATH = resolve(PROJECT_ROOT, '.env')

// ---- 帮助 ----

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Bilibili QR 码登录脚本

用法:
  npx tsx scripts/login.ts             打印凭据到终端
  npx tsx scripts/login.ts --write     写入 .env 文件
  npx tsx scripts/login.ts --help      显示此帮助

流程:
  1. 生成二维码 → 终端显示
  2. 用手机 B 站 App 扫码确认
  3. 自动提取 Cookie 凭据
  4. 输出到终端或写入 .env
`)
  process.exit(0)
}

const SHOULD_WRITE = process.argv.includes('--write')

// ---- 工具 ----

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 从 Set-Cookie 头中提取指定 key 的值 */
function extractCookie(headers: Record<string, unknown>, key: string): string | undefined {
  const raw = headers['set-cookie']
  if (!raw) return undefined
  const cookies = Array.isArray(raw) ? (raw as string[]) : [raw as string]
  for (const entry of cookies) {
    const re = new RegExp(`(?:^|,\\s*)${key}=([^;]+)`)
    const match = re.exec(entry)
    if (match) return match[1]
  }
  return undefined
}

/** 格式化当前时间 */
function timestamp(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

// ---- 主流程 ----

async function login(): Promise<void> {
  console.log('')
  console.log('  ╔══════════════════════════════════════════╗')
  console.log('  ║     Bilibili 二维码登录                   ║')
  console.log('  ╚══════════════════════════════════════════╝')
  console.log('')

  // ── 1. 获取二维码 ──

  console.log(`  [${timestamp()}] 正在获取二维码...`)

  const generateRes = await axios.get<{
    code: number
    message: string
    data: { url: string; auth_code: string }
  }>('https://api.bilibili.com/x/passport-login/web/qrcode/generate')

  if (generateRes.data.code !== 0) {
    console.error(`  ❌ 获取二维码失败: ${generateRes.data.message}`)
    process.exit(1)
  }

  const { url: qrUrl, auth_code: authCode } = generateRes.data.data

  // ── 2. 显示二维码 ──

  console.log(`  [${timestamp()}] 请用手机 B 站 App 扫码登录`)
  console.log('')

  const qrString = await QRCode.toString(qrUrl, { type: 'terminal', small: true })
  console.log(qrString)

  console.log('')
  console.log('  ⏳ 等待扫码... (按 Ctrl+C 取消)')
  console.log('')

  // ── 3. 轮询扫码结果 ──

  let pollCount = 0

  for (;;) {
    await sleep(1500)
    pollCount++

    let pollRes: AxiosResponse<{
      code: number
      message: string
      data?: { url?: string }
    }>

    try {
      pollRes = await axios.get('https://api.bilibili.com/x/passport-login/web/qrcode/poll', {
        params: { auth_code: authCode },
      })
    } catch {
      console.error(`  [${timestamp()}] ⚠️  网络错误，重试中...`)
      continue
    }

    const { code } = pollRes.data

    if (code === 0) {
      // ── 4. 登录成功，提取 Cookie ──
      const headers = pollRes.headers

      const sessdata = extractCookie(headers, 'SESSDATA')
      const biliJct = extractCookie(headers, 'bili_jct')
      const dedeUserId = extractCookie(headers, 'DedeUserID')
      const buvid3 = extractCookie(headers, 'buvid3')
      const buvid4 = extractCookie(headers, 'buvid4')
      const refreshToken = extractCookie(headers, 'refresh_token')
      const acTimeValue = extractCookie(headers, 'ac_time_value')

      if (!sessdata || !biliJct || !dedeUserId) {
        console.error('  ❌ 未能提取完整的 Cookie 凭据')
        console.error('     原始 Set-Cookie:', JSON.stringify(headers['set-cookie']))
        process.exit(1)
      }

      console.log(`  [${timestamp()}] ✅ 登录成功！`)
      console.log('')
      console.log('  ┌─ 凭据 ──────────────────────────────┐')

      const lines = [
        `# Bilibili SDK 凭据 — 由 login.ts 自动生成 (${new Date().toISOString()})`,
        `BILIBILI_SESSDATA=${sessdata}`,
        `BILIBILI_BILI_JCT=${biliJct}`,
        `BILIBILI_DEDE_USER_ID=${dedeUserId}`,
      ]
      if (buvid3) lines.push(`BILIBILI_BUVID3=${buvid3}`)
      if (buvid4) lines.push(`BILIBILI_BUVID4=${buvid4}`)
      if (refreshToken) lines.push(`BILIBILI_REFRESH_TOKEN=${refreshToken}`)
      if (acTimeValue) lines.push(`BILIBILI_AC_TIME_VALUE=${acTimeValue}`)

      const envContent = lines.join('\n') + '\n'

      // 打印到终端（隐藏敏感信息的部分字符）
      for (const line of lines) {
        if (line.startsWith('#') || line.startsWith('BILIBILI_DEDE_USER_ID')) {
          console.log(`  │ ${line.padEnd(49)}│`)
        } else if (line.includes('=')) {
          const [k, v] = line.split('=', 2)
          const masked =
            v.length > 8
              ? v.slice(0, 4) + '•'.repeat(Math.min(v.length - 8, 20)) + v.slice(-4)
              : '•'.repeat(v.length)
          console.log(`  │ ${k}=${masked}`.padEnd(51) + '│')
        }
      }
      console.log('  └──────────────────────────────────────┘')
      console.log('')

      // ── 5. 可选写入 .env ──

      if (SHOULD_WRITE) {
        // 保留 .env 中已有的非 BILIBILI_ 开头的配置
        let existingExtra = ''
        if (existsSync(ENV_PATH)) {
          const current = readFileSync(ENV_PATH, 'utf-8')
          existingExtra = current
            .split('\n')
            .filter((l) => !l.startsWith('BILIBILI_') && !l.startsWith('# Bilibili'))
            .join('\n')
            .trim()
        }

        const fullContent = envContent + (existingExtra ? '\n' + existingExtra + '\n' : '')
        writeFileSync(ENV_PATH, fullContent)
        console.log(`  ✅ 已写入 ${ENV_PATH}`)
        console.log('')
      } else {
        console.log('  📋 复制以下内容到 .env 文件:')
        console.log('')
        console.log('  ── 8< ─────────────────────────────────')
        console.log(envContent.trimEnd())
        console.log('  ── 8< ─────────────────────────────────')
        console.log('')
        console.log(`  或使用 --write 参数自动写入:`)
        console.log('    npx tsx scripts/login.ts --write')
        console.log('')
      }

      break
    }

    if (code === -2) {
      console.error(`  [${timestamp()}] ❌ 二维码已过期，请重新运行`)
      process.exit(1)
    }

    // code === -1: 未扫码，继续轮询
    if (pollCount % 10 === 0) {
      console.log(`  [${timestamp()}] ⏳ 等待扫码中... (已等待 ${String(pollCount * 1.5)}s)`)
    }
  }
}

login().catch((err: unknown) => {
  console.error('  ❌ 登录失败:', err instanceof Error ? err.message : err)
  process.exit(1)
})
