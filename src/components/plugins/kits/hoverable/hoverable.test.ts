// @vitest-environment jsdom
import { createRoot } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { hoverable, type HoverableController } from './hoverable'

const disposers: (() => void)[] = []
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()))

/** 能力构建需要组件作用域；Controller 在构建返回时即可使用。 */
function build<T>(factory: () => T): T {
  return createRoot((dispose) => {
    disposers.push(dispose)
    return factory()
  })
}

describe('hoverable controller', () => {
  test('Controller 立即提供状态面板和 hover 操作', async () => {
    const { controller } = build(() => hoverable())

    expect(val(controller.hovered)).toBe(false)
    controller.hover()
    await expect.poll(() => val(controller.hovered)).toBe(true)
    controller.unhover()
    await expect.poll(() => val(controller.hovered)).toBe(false)
  })

  test('options 生效且两次构建的状态互不关联', async () => {
    const first = build(() => hoverable({ initialHovered: true }))
    const second = build(() => hoverable())
    const firstController: HoverableController = first.controller
    const secondController: HoverableController = second.controller

    expect(firstController).not.toBe(secondController)
    expect(firstController.hovered).not.toBe(secondController.hovered)
    expect(val(firstController.hovered)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)

    firstController.unhover()
    await expect.poll(() => val(firstController.hovered)).toBe(false)
    expect(val(secondController.hovered)).toBe(false)
  })
})
