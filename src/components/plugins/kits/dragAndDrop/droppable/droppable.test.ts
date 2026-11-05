import type { Plugin } from '@/components/plugins/tools/defineInactivePlugin'
// @vitest-environment jsdom
import { createRoot, flush } from 'solid-js'
import { onCleanup } from '@/foundation'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { usePlugin } from '@/components/plugins/tools/usePlugin'
import { droppable } from './droppable'

describe('droppable controller', () => {
  test('提供启用、悬停和接受状态面板', async () => {
    const [plugin, controller] = usePlugin(droppable)
    mount(plugin)

    expect(val(controller.enabled)).toBe(true)
    expect(val(controller.hovering)).toBe(false)
    expect(val(controller.acceptable)).toBe(false)
    controller.disable!()
    await expect.poll(() => val(controller.enabled)).toBe(false)
    controller.enable!()
    await expect.poll(() => val(controller.enabled)).toBe(true)
  })
})

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach(dispose => dispose()))

function mount(plugin: Plugin) {
  createRoot(dispose => { disposers.push(dispose); plugin({ element: document.createElement('div'), onCleanup, addProps: () => {} }) })
  flush()
}
