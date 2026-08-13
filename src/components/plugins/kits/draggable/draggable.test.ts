import { describe, expect, test } from 'vitest'
import { val } from '../../../../hooks'
import { usePlugin } from '../../usePlugin'
import { draggable } from './draggable'

describe('draggable controller', () => {
  test('提供启用状态且每次实例化相互隔离', () => {
    const [, first] = usePlugin(draggable, { payload: 'first' })
    const [, second] = usePlugin(draggable, { payload: 'second', disabled: true })

    expect(val(first.enabled)).toBe(true)
    expect(val(second.enabled)).toBe(false)
    first.disable()
    expect(val(first.enabled)).toBe(false)
    expect(val(second.enabled)).toBe(false)
    second.enable()
    expect(val(second.enabled)).toBe(true)
  })
})
