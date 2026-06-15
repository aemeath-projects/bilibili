/**
 * 动态操作 API（动作类）
 */

import type { BiliClient } from '../../transport'
import type { BiliApiResponse } from '../../types'

/** 点赞动态 */
export async function likeDynamic(
  client: BiliClient,
  dynamicId: string,
  unlike = false,
): Promise<BiliApiResponse> {
  return client.post(
    '/x/polymer/web-dynamic/v1/thumb/add',
    {
      dynamic_id: dynamicId,
      up: unlike ? '2' : '1',
    },
    'cookie',
  )
}
