import type { Plugin } from '@/components/plugins/tools/defineInactivePlugin'
// @vitest-environment jsdom
import { createRoot, flush } from 'solid-js'
import { onCleanup } from '@/foundation'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { usePlugin } from '../../tools/usePlugin'
import { clickable } from './clickable'

describe('clickable controller', () => {
  test('Controller 暴露 hover、focused、pressed 状态和对应操作', async () => {
    const [plugin, controller] = usePlugin(clickable)
    mount(plugin)

    controller.hover!()
    controller.press!()
    controller.focus!()
    await expect.poll(() => val(controller.hovered)).toBe(true)
    expect(val(controller.pressed)).toBe(true)
    expect(val(controller.focused)).toBe(true)

    controller.unhover!()
    controller.release!()
    controller.blur!()
    await expect.poll(() => val(controller.hovered)).toBe(false)
    expect(val(controller.pressed)).toBe(false)
    expect(val(controller.focused)).toBe(false)
  })

  test('options 初始化状态，多个 Controller 保持独立', () => {
    const [firstPlugin, firstController] = usePlugin(clickable, {
      initialHovered: true,
      initialFocused: true,
      initialPressed: true,
    })
    const [secondPlugin, secondController] = usePlugin(clickable)
    mount(firstPlugin); mount(secondPlugin)

    expect(firstController).not.toBe(secondController)
    expect(val(firstController.hovered)).toBe(true)
    expect(val(firstController.focused)).toBe(true)
    expect(val(firstController.pressed)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)
    expect(val(secondController.focused)).toBe(false)
    expect(val(secondController.pressed)).toBe(false)
  })


})

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach(dispose => dispose()))

function mount(plugin: Plugin) {
  createRoot(dispose => { disposers.push(dispose); plugin({ element: document.createElement('div'), onCleanup, addProps: () => {} }) })
  flush()
}
