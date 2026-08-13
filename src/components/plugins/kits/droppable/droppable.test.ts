import { describe, expect, test } from 'vitest'
import { val } from '../../../../hooks'
import { usePlugin } from '../../usePlugin'
import { droppable } from './droppable'

describe('droppable controller', () => {
  test('提供启用、悬停和接受状态面板', () => {
    const [, controller] = usePlugin(droppable)

    expect(val(controller.enabled)).toBe(true)
    expect(val(controller.hovering)).toBe(false)
    expect(val(controller.acceptable)).toBe(false)
    controller.disable()
    expect(val(controller.enabled)).toBe(false)
    controller.enable()
    expect(val(controller.enabled)).toBe(true)
  })
})
