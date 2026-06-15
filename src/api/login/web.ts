/**
 * 登录 API — Web 端
 *
 * 默认使用 Web 端登录接口
 */

import type { BiliClient } from '../../transport'
import type { BiliApiResponse } from '../../types'

// ---- Web 端登录 ----

/** 获取二维码登录 URL 和 auth_code */
export async function getQrCodeUrl(
  client: BiliClient,
): Promise<BiliApiResponse<{ url: string; auth_code: string }>> {
  return client.get('/x/passport-login/web/qrcode/generate', {}, 'none')
}

/** 轮询二维码扫码状态 */
export async function pollQrCode(
  client: BiliClient,
  authCode: string,
): Promise<BiliApiResponse<{ code: number; message: string; url?: string }>> {
  return client.get('/x/passport-login/web/qrcode/poll', { auth_code: authCode }, 'none')
}

/** 获取登录状态 */
export async function getLoginStatus(client: BiliClient): Promise<BiliApiResponse> {
  return client.get('/x/web-interface/nav', {}, 'cookie')
}

/** 刷新 Cookie */
export async function refreshCookie(
  client: BiliClient,
  refreshToken: string,
): Promise<BiliApiResponse> {
  return client.get('/x/passport-login/web/cookie/info', { refresh_token: refreshToken }, 'cookie')
}

/** 退出登录 */
export async function logout(client: BiliClient): Promise<BiliApiResponse> {
  return client.post('/x/passport-login/web/logout', {}, 'cookie')
}
