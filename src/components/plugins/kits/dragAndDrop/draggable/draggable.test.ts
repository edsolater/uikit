// @vitest-environment jsdom
import { createRoot } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { draggable } from './draggable'

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()))

/** 能力构建需要组件作用域；Controller 在构建返回时即可使用。 */
function build<T>(factory: () => T): T {
  return createRoot((dispose) => {
    disposers.push(dispose)
    return factory()
  })
}

describe('draggable controller', () => {
  test('提供启用状态且每次构建相互隔离', async () => {
    const first = build(() => draggable({ payload: 'first' }))
    const second = build(() =>
      draggable({ payload: 'second', disabled: true }),
    )

    expect(val(first.controller.enabled)).toBe(true)
    expect(val(second.controller.enabled)).toBe(false)
    first.controller.disable()
    await expect.poll(() => val(first.controller.enabled)).toBe(false)
    expect(val(second.controller.enabled)).toBe(false)
    second.controller.enable()
    await expect.poll(() => val(second.controller.enabled)).toBe(true)
  })
})
