/**
 * Cheese API 集成测试
 */
import { expect } from 'vitest'

import { getCheeseMeta, getCheeseList } from '../../src/api/cheese/index.js'

import { createAnonymousClient, describeIf, expectApiSuccess } from './helpers.js'

const client = createAnonymousClient()

describeIf('BILIBILI_TEST_CHEESE_SEASON_ID')('Cheese API', () => {
  const seasonId = Number(process.env.BILIBILI_TEST_CHEESE_SEASON_ID) || 0

  it('getCheeseMeta 返回课程元数据', async () => {
    if (!seasonId) return
    const res = await expectApiSuccess(() => getCheeseMeta(client, { seasonId }))
    if (!res) return
    expect(res.code).toBe(0)
  })

  it('getCheeseList 返回课程列表', async () => {
    if (!seasonId) return
    const res = await expectApiSuccess(() => getCheeseList(client, seasonId))
    if (!res) return
    expect(res.code).toBe(0)
  })
})
