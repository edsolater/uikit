/**
 * 折叠阅读区域的原生交互验证。
 *
 * 核对摘要键盘操作能真正展开内容。
 *
 * 防止重命名和组合变化丢失阅读入口。
 */
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from '@/foundation'
import { Details } from './Details'

test('摘要保留原生键盘展开行为', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const dispose = render(() => <Details summary="详情">实际内容</Details>, host)
  try {
    host.querySelector('summary')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => host.querySelector('details')!.open).toBe(true)
  } finally {
    dispose()
    host.remove()
  }
})
