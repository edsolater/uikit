import { expect, test, vi } from 'vitest'
import { render } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import { createInactivePlugin } from '@/components/plugins/tools/createInactivePlugin'
import { domTask } from './domTask'

test('本次缺少元素时跳过操作，下次执行重新获取元素', async () => {
  let target: HTMLButtonElement | undefined
  const getAction = vi.fn((element: HTMLButtonElement) => () => !element.disabled)
  const run = domTask({ getDom: () => target, getAction })

  const missing = run()
  await expect(missing.result).resolves.toBeUndefined()
  expect(await missing.isSuccess).toBe(false)
  expect(getAction).not.toHaveBeenCalled()

  target = document.createElement('button')
  expect(await run().isSuccess).toBe(true)
  expect(getAction).toHaveBeenCalledExactlyOnceWith(target)
})

test('惰性执行在消费后取一次节点、组装一次动作并交付本次调用参数', async () => {
  const host = document.createElement('div')
  const getAction = vi.fn((element: HTMLElement) => (value: string) => {
    element.dataset.mark = value
    return true
  })
  const plugin = createInactivePlugin({
    name: 'action',
    pluginCore({ domProxy }) {
      const getDom = vi.fn(() => domProxy)
      return { getDom, mark: domTask({ getDom, getAction }) }
    },
  })
  let controller!: ReturnType<typeof plugin>['controller']
  let completed!: Promise<boolean>
  const dispose = render(() => {
    const capability = plugin()
    controller = capability.controller
    const execution = controller.mark.lazyExec('已执行')
    expect(controller.getDom).not.toHaveBeenCalled()
    expect(getAction).not.toHaveBeenCalled()
    completed = execution.isSuccess
    expect(controller.getDom).not.toHaveBeenCalled()
    return <Piv is={capability} />
  }, host)
  try {
    expect(await completed).toBe(true)
    expect(controller.getDom).toHaveBeenCalledTimes(1)
    expect(getAction).toHaveBeenCalledExactlyOnceWith(host.firstElementChild)
    expect(host.firstElementChild?.getAttribute('data-mark')).toBe('已执行')
  } finally {
    dispose()
  }
})
