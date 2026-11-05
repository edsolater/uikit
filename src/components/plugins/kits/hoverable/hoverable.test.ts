import type { Plugin } from '@/components/plugins/defineInactivePlugin'
// @vitest-environment jsdom
import { createRoot, flush } from 'solid-js'
import { onCleanup } from '@/foundation'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { usePlugin } from '../../usePlugin'
import { hoverable } from './hoverable'

describe('hoverable controller', () => {
  test('Controller 同时提供状态面板和 hover 操作', async () => {
    const [plugin, controller] = usePlugin(hoverable)
    mount(plugin)

    expect(val(controller.hovered)).toBe(false)
    controller.hover!()
    await expect.poll(() => val(controller.hovered)).toBe(true)
    controller.unhover!()
    await expect.poll(() => val(controller.hovered)).toBe(false)
  })

  test('options 生效且两次 usePlugin 的状态互不关联', async () => {
    const [firstPlugin, firstController] = usePlugin(hoverable, { initialHovered: true })
    const [secondPlugin, secondController] = usePlugin(hoverable)
    mount(firstPlugin); mount(secondPlugin)

    expect(firstController).not.toBe(secondController)
    expect(firstController.hovered).not.toBe(secondController.hovered)
    expect(val(firstController.hovered)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)

    firstController.unhover!()
    await expect.poll(() => val(firstController.hovered)).toBe(false)
    expect(val(secondController.hovered)).toBe(false)
  })
})

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach(dispose => dispose()))

function mount(plugin: Plugin) {
  createRoot(dispose => { disposers.push(dispose); plugin({ element: document.createElement('div'), onCleanup, addProps: () => {} }) })
  flush()
}
