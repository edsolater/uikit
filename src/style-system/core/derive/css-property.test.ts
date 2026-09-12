/** 验证属性保持值对象关系，沿共同链激活并延迟解析。 */
import { expect, expectTypeOf, test, vi } from 'vitest'
import { block, type Block } from '../css-block'
import { property, type Property } from './css-property'
import { value } from './css-value'

test('连接保留输入，直接值属性在读取时取得惰性副本', () => {
  const blue = value('blue')
  const color = property('color', blue)
  const parent = block().attach(color)
  expectTypeOf<Property>().toExtend<Block>()
  expect(parent.children[0]).toBe(color)
  expect(color.value).not.toBe(blue)
  expect(color.getDependencies()).toEqual([color.value])
  expect(color.parseCss()).toBe('color: blue;')
})

test('属性派生隔离直接持有的值对象', () => {
  const blue = value('blue')
  const original = property('color', blue)
  const next = original()
  expectTypeOf(next).toEqualTypeOf(original)
  next.key = 'background'
  expect(next.value).not.toBe(blue)
  next.value.activate()
  expect(next.value.isActive).toBe(true)
  expect(blue.isActive).toBe(false)
  next.value = value('red')
  expect(original.parseCss()).toBe('color: blue;')
  expect(next.parseCss()).toBe('background: red;')
})

test('属性在接通时读取当前值关系，不激活已被替换的离线值', () => {
  const oldActive = vi.fn()
  const newActive = vi.fn()
  const color = property('color', value('blue', { onActive: oldActive }))
  const red = value('red', { onActive: newActive })
  const parse = vi.spyOn(red, 'parseCss')
  color.value = red
  const parent = block().attach(color)
  parent.activate()
  expect(oldActive).not.toHaveBeenCalled()
  expect(newActive).toHaveBeenCalledTimes(1)
  expect(parse).not.toHaveBeenCalled()
  expect(parent.parseCss()).toBe('color: red;')
})

test('相同属性被多个父级直接使用时共享身份及一次性激活', () => {
  const active = vi.fn()
  const color = property('color', value('blue', { onActive: active }))
  const first = block().attach(color)
  const second = block().attach(color)
  first.activate()
  second.activate()
  expect(first.children[0]).toBe(second.children[0])
  expect(active).toHaveBeenCalledTimes(1)
})
