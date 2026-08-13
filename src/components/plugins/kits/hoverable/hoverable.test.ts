import { describe, expect, test } from 'vitest'
import { val } from '../../../../hooks'
import { usePlugin } from '../../usePlugin'
import { hoverable } from './hoverable'

describe('hoverable controller', () => {
  test('Controller 同时提供状态面板和 hover 操作', () => {
    const [, controller] = usePlugin(hoverable)

    expect(val(controller.hovered)).toBe(false)
    controller.hover()
    expect(val(controller.hovered)).toBe(true)
    controller.unhover()
    expect(val(controller.hovered)).toBe(false)
  })

  test('options 生效且两次 usePlugin 的状态互不关联', () => {
    const [, firstController] = usePlugin(hoverable, { initialHovered: true })
    const [, secondController] = usePlugin(hoverable)

    expect(firstController).not.toBe(secondController)
    expect(firstController.hovered).not.toBe(secondController.hovered)
    expect(val(firstController.hovered)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)

    firstController.unhover()
    expect(val(firstController.hovered)).toBe(false)
    expect(val(secondController.hovered)).toBe(false)
  })
})
