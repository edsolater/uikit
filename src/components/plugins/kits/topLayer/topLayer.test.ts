// @vitest-environment jsdom
import { createRoot } from 'solid-js'
import { expect, test } from 'vitest'
import { val } from '@/foundation'
import { topLayer } from './topLayer'

test('元素接入前 Controller 已完整，依赖 DOM 的方法为 no-op', () => {
  createRoot((dispose) => {
    const { controller } = topLayer()
    expect(controller.enter).toBeDefined()
    expect(controller.leave).toBeDefined()
    expect(val(controller.active)).toBe(false)
    expect(() => controller.enter()).not.toThrow()
    expect(() => controller.leave()).not.toThrow()
    expect(val(controller.active)).toBe(false)
    dispose()
  })
})
