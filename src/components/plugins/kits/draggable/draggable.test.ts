import type { Plugin } from '@/components/plugins/defineInactivePlugin'
// @vitest-environment jsdom
import { createRoot, flush } from 'solid-js'
import { onCleanup } from '@/foundation'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { usePlugin } from '../../usePlugin'
import { draggable } from './draggable'

describe('draggable controller', () => {
  test('提供启用状态且每次实例化相互隔离', async () => {
    const [firstPlugin, first] = usePlugin(draggable, { payload: 'first' })
    const [secondPlugin, second] = usePlugin(draggable, {
      payload: 'second',
      disabled: true,
    })
    mount(firstPlugin); mount(secondPlugin)

    expect(val(first.enabled)).toBe(true)
    expect(val(second.enabled)).toBe(false)
    first.disable!()
    await expect.poll(() => val(first.enabled)).toBe(false)
    expect(val(second.enabled)).toBe(false)
    second.enable!()
    await expect.poll(() => val(second.enabled)).toBe(true)
  })
})

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach(dispose => dispose()))

function mount(plugin: Plugin) {
  createRoot(dispose => { disposers.push(dispose); plugin({ element: document.createElement('div'), onCleanup, addProps: () => {} }) })
  flush()
}
