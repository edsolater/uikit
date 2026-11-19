import { expect, test, vi } from 'vitest'
import { render } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import { createInactivePlugin } from '@/components/plugins/tools/createInactivePlugin'
import { runDomAction } from './runDomAction'

test('本次缺少元素时跳过操作，下次执行重新获取元素', async () => {
  let target: HTMLButtonElement | undefined
  const action = vi.fn((element: HTMLButtonElement) => !element.disabled)
  const run = runDomAction(() => target, action)

  const missing = run()
  await expect(missing.result).resolves.toBeUndefined()
  expect(await missing.isSuccess).toBe(false)
  expect(action).not.toHaveBeenCalled()

  target = document.createElement('button')
  expect(await run().isSuccess).toBe(true)
  expect(action).toHaveBeenCalledExactlyOnceWith(target)
})

test('直接传入 domProxy 时等待真实元素，再把本次参数交给操作', async () => {
  const host = document.createElement('div')
  const plugin = createInactivePlugin({
    name: 'action',
    pluginCore({ domProxy }) {
      return {
        mark: runDomAction(domProxy, (element, value: string) => {
          element.dataset.mark = value
          return true
        }),
      }
    },
  })
  let completed!: Promise<boolean>
  const dispose = render(() => {
    const capability = plugin()
    completed = capability.controller.mark('已执行').isSuccess
    return <Piv is={capability} />
  }, host)
  try {
    expect(await completed).toBe(true)
    expect(host.firstElementChild?.getAttribute('data-mark')).toBe('已执行')
  } finally {
    dispose()
  }
})
