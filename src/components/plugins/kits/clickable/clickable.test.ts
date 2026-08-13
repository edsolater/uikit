import { describe, expect, test, vi } from 'vitest'
import { val } from '../../../../hooks'
import { usePlugin } from '../../usePlugin'
import { clickable } from './clickable'

describe('clickable controller', () => {
  test('Controller 暴露 hover、focused、pressed 状态和对应操作', () => {
    const [, controller] = usePlugin(clickable)

    controller.hover()
    controller.press()
    controller.focus()
    expect(val(controller.hovered)).toBe(true)
    expect(val(controller.pressed)).toBe(true)
    expect(val(controller.focused)).toBe(true)

    controller.unhover()
    controller.release()
    controller.blur()
    expect(val(controller.hovered)).toBe(false)
    expect(val(controller.pressed)).toBe(false)
    expect(val(controller.focused)).toBe(false)
  })

  test('options 初始化状态，多个 Controller 保持独立', () => {
    const [, firstController] = usePlugin(clickable, {
      initialHovered: true,
      initialFocused: true,
      initialPressed: true,
    })
    const [, secondController] = usePlugin(clickable)

    expect(firstController).not.toBe(secondController)
    expect(val(firstController.hovered)).toBe(true)
    expect(val(firstController.focused)).toBe(true)
    expect(val(firstController.pressed)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)
    expect(val(secondController.focused)).toBe(false)
    expect(val(secondController.pressed)).toBe(false)
  })

  test('尚未连接 Piv 时调用 click 不会伪造点击或抛错', () => {
    const [, controller] = usePlugin(clickable)
    const click = vi.fn(() => controller.click())

    expect(click).not.toThrow()
  })
})
