/** 检查声明保留原对象引用，以及文本输出与激活的边界。 */
import { expect, expectTypeOf, test, vi } from 'vitest'
import type { Block } from './css-block'
import { declaration, type Declaration } from './css-declaration'
import { key, type Key } from './css-key'
import { value } from './css-value'

test('Key 与 Value 组成独立 Declaration，并由 Declaration 负责标点', () => {
  const active = vi.fn()
  const colorKey = key('color')
  const blue = value('blue', { onActive: active })
  const first = declaration(colorKey, blue)
  const second = declaration(colorKey, blue)
  expectTypeOf(colorKey).toEqualTypeOf<Key<'color'>>()
  expectTypeOf(first).toEqualTypeOf<Declaration<'color'>>()
  expectTypeOf<Declaration>().not.toExtend<Block>()
  expect(typeof colorKey).toBe('object')
  expect(first.key).toBe(colorKey)
  expect(second).not.toBe(first)
  expect(first.value).toBe(blue)
  expect(first.parseCss()).toBe('color: blue;')
  expect(active).not.toHaveBeenCalled()
})
