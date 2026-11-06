// @vitest-environment jsdom
import { createRoot } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { droppable } from './droppable'

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()))

/** 能力构建需要组件作用域；Controller 在构建返回时即可使用。 */
function build<T>(factory: () => T): T {
  return createRoot((dispose) => {
    disposers.push(dispose)
    return factory()
  })
}

describe('droppable controller', () => {
  test('提供启用、悬停和接受状态面板', async () => {
    const { controller } = build(() => droppable())

    expect(val(controller.enabled)).toBe(true)
    expect(val(controller.hovering)).toBe(false)
    expect(val(controller.acceptable)).toBe(false)
    controller.disable()
    await expect.poll(() => val(controller.enabled)).toBe(false)
    controller.enable()
    await expect.poll(() => val(controller.enabled)).toBe(true)
  })
})
