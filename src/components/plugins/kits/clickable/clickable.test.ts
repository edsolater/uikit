// @vitest-environment jsdom
import { createRoot } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { clickable } from './clickable'

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()))

/** 能力构建需要组件作用域；Controller 在构建返回时即可使用。 */
function build<T>(factory: () => T): T {
  return createRoot((dispose) => {
    disposers.push(dispose)
    return factory()
  })
}

describe('clickable controller', () => {
  test('Controller 暴露 hover、focused、pressed 状态和对应操作', async () => {
    const { controller } = build(() => clickable())

    controller.hover()
    controller.press()
    controller.focus()
    await expect.poll(() => val(controller.hovered)).toBe(true)
    expect(val(controller.pressed)).toBe(true)
    expect(val(controller.focused)).toBe(true)

    controller.unhover()
    controller.release()
    controller.blur()
    await expect.poll(() => val(controller.hovered)).toBe(false)
    expect(val(controller.pressed)).toBe(false)
    expect(val(controller.focused)).toBe(false)
  })

  test('options 初始化状态，多个 Controller 保持独立', () => {
    const first = build(() =>
      clickable({
        initialHovered: true,
        initialFocused: true,
        initialPressed: true,
      }),
    )
    const second = build(() => clickable())

    expect(first.controller).not.toBe(second.controller)
    expect(val(first.controller.hovered)).toBe(true)
    expect(val(first.controller.focused)).toBe(true)
    expect(val(first.controller.pressed)).toBe(true)
    expect(val(second.controller.hovered)).toBe(false)
    expect(val(second.controller.focused)).toBe(false)
    expect(val(second.controller.pressed)).toBe(false)
  })
})
