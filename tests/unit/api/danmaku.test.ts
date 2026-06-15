/**
 * Danmaku API 单元测试
 */
import { describe, expect, it, vi, afterEach } from 'vitest'

import {
  getDanmaku,
  getHistoryDanmaku,
  getDanmakuView,
  getDanmakuSnapshot,
  sendDanmaku,
  likeDanmaku,
} from '../../../src/api'
import type { BiliClient } from '../../../src/transport'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockClient = { get: mockGet, post: mockPost } as unknown as BiliClient

describe('danmaku', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getDanmaku', () => {
    it('必需参数 oid + segmentIndex', async () => {
      await getDanmaku(mockClient, 123, 1)
      expect(mockGet).toHaveBeenCalledWith(
        '/x/v2/dm/wbi/web/seg.so',
        { oid: '123', type: '1', segment_index: '1', pid: '' },
        'wbi',
      )
    })

    it('带 pid', async () => {
      await getDanmaku(mockClient, 123, 2, 456)
      expect(mockGet).toHaveBeenCalledWith(
        '/x/v2/dm/wbi/web/seg.so',
        { oid: '123', type: '1', segment_index: '2', pid: '456' },
        'wbi',
      )
    })
  })

  describe('getHistoryDanmaku', () => {
    it('传递 oid + date', async () => {
      await getHistoryDanmaku(mockClient, 123, '2024-01-01')
      expect(mockGet).toHaveBeenCalledWith(
        '/x/v2/dm/web/history/seg.so',
        { oid: '123', type: '1', date: '2024-01-01' },
        'cookie',
      )
    })
  })

  describe('getDanmakuView', () => {
    it('必需参数 oid', async () => {
      await getDanmakuView(mockClient, 123)
      expect(mockGet).toHaveBeenCalledWith('/x/v2/dm/web/view', { type: '1', oid: '123', pid: '' })
    })

    it('带 pid', async () => {
      await getDanmakuView(mockClient, 123, 456)
      expect(mockGet).toHaveBeenCalledWith('/x/v2/dm/web/view', {
        type: '1',
        oid: '123',
        pid: '456',
      })
    })
  })

  describe('getDanmakuSnapshot', () => {
    it('传递 aid', async () => {
      await getDanmakuSnapshot(mockClient, 170001)
      expect(mockGet).toHaveBeenCalledWith('/x/v2/dm/ajax', { aid: '170001' })
    })
  })

  describe('sendDanmaku', () => {
    it('必需参数 oid + bvid + msg + progress', async () => {
      await sendDanmaku(mockClient, { oid: 123, bvid: 'BV1xx', msg: 'hello', progress: 5000 })
      expect(mockPost).toHaveBeenCalledWith(
        '/x/v2/dm/post',
        {
          type: '1',
          oid: '123',
          bvid: 'BV1xx',
          msg: 'hello',
          progress: '5000',
          color: '16777215',
          fontsize: '25',
          pool: '0',
          mode: '1',
          plat: '1',
        },
        'cookie',
      )
    })

    it('自定义弹幕样式', async () => {
      await sendDanmaku(mockClient, {
        oid: 123,
        bvid: 'BV1xx',
        msg: 'hello',
        progress: 0,
        color: 0xff0000,
        mode: 4,
        fontSize: 36,
        pool: 1,
      })
      expect(mockPost).toHaveBeenCalledWith(
        '/x/v2/dm/post',
        expect.objectContaining({ color: '16711680', mode: '4', fontsize: '36', pool: '1' }),
        'cookie',
      )
    })
  })

  describe('likeDanmaku', () => {
    it('点赞', async () => {
      await likeDanmaku(mockClient, 12345, 678)
      expect(mockPost).toHaveBeenCalledWith(
        '/x/v2/dm/thumbup/add',
        { dmid: '12345', oid: '678', op: '1', platform: 'web_player' },
        'cookie',
      )
    })

    it('取消点赞', async () => {
      await likeDanmaku(mockClient, 12345, 678, true)
      expect(mockPost).toHaveBeenCalledWith(
        '/x/v2/dm/thumbup/add',
        { dmid: '12345', oid: '678', op: '2', platform: 'web_player' },
        'cookie',
      )
    })
  })
})
