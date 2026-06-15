/**
 * Audio API 集成测试
 */
import { describe, expect } from 'vitest'

import { getAudioInfo, getAudioList, getAudioHomepageRecommend } from '../../src/api'

import { createAnonymousClient, expectApiSuccess } from './helpers.js'

const client = createAnonymousClient()

describe('Audio API — 公开数据', () => {
  it('getAudioInfo 返回音频信息', async () => {
    const res = await expectApiSuccess(() => getAudioInfo(client, 12345))
    if (!res) return
    expect(res).toBeDefined()
  })

  it('getAudioList 返回音频列表', async () => {
    const res = await expectApiSuccess(() => getAudioList(client))
    if (!res) return
    expect(res).toBeDefined()
  })

  it('getAudioHomepageRecommend 返回推荐', async () => {
    const res = await expectApiSuccess(() => getAudioHomepageRecommend(client))
    if (!res) return
    expect(res).toBeDefined()
  })
})
