/** 验证基本值、变量均可直接共享或显式派生，不提前压平关系。 */
import { expect, expectTypeOf, test, vi } from 'vitest'
import { isBlock, type Block } from '../css-block'
import { value, type Value } from './css-value'
import { variable, registerVariable, type Variable } from './css-variable'
import { property } from './css-property'
import { selector } from './css-selector'

test('所有语义对象具备相同派生能力，分类由构造函数提供', () => {
  const length = value('2px')
  const height = variable('height', length)
  const declaration = property('height', height)
  const style = selector('.example')
  expectTypeOf<Value>().toExtend<Block>()
  expectTypeOf<Variable>().toExtend<Value>()
  for (const original of [length, height, declaration, style]) {
    const next = original()
    expect(isBlock(next)).toBe(true)
    expect(next.kind).toBe(original.kind)
    expect(next).not.toBe(original)
    expect(next.isActive).toBe(false)
  }
  expect(isBlock(() => {})).toBe(false)
})

test('命名值直接复用，调用派生才隔离原始内容', () => {
  const thin = value('2px')
  const next = thin()
  expectTypeOf(next).toEqualTypeOf(thin)
  next.raw = '4px'
  expect(thin.raw).toBe('2px')
  expect(next().raw).toBe('4px')
  expect(value(0).parseCss()).toBe('0')
})

test('Property → Variable → Value 保存原对象并共享激活', () => {
  const active = vi.fn()
  const fallback = value('blue', { onActive: active })
  const parse = vi.spyOn(fallback, 'parseCss')
  const foreground = variable('foreground', fallback)
  const color = property('color', foreground)
  const first = selector('.button').attach(color)
  const second = selector('.input').attach(color)
  first.activate()
  second.activate()
  expect(color.value).toBe(foreground)
  expect(foreground.defaultValue).toBe(fallback)
  expect(fallback.isActive).toBe(true)
  expect(active).toHaveBeenCalledTimes(1)
  expect(parse).not.toHaveBeenCalled()
  expect(first.parseCss()).toBe('.button { color: var(--foreground, blue); }')
})

test('变量派生保留名称字段，独立修改不回写，依赖仍可共享', () => {
  const fallback = value('blue')
  const original = variable('first', fallback)
  const next = original()
  next.name = 'next'
  expect(next.defaultValue).toBe(fallback)
  expect(next().name).toBe('next')
  expect(original.parseCss()).toBe('var(--first, blue)')
  expect(next.parseCss()).toBe('var(--next, blue)')
  expect(variable('plain').parseCss()).toBe('var(--plain)')
})

test('既有状态后缀材料可继续消费可调用值，不伪装成全局智能注册', () => {
  const foreground = registerVariable({ name: 'foreground', value: value('blue') })
  const surface = registerVariable({
    name: 'surface', value: { default: value('blue'), hover: value('red') },
  })
  expect(foreground.parseCss()).toBe('var(--foreground, blue)')
  expect(surface.hover.parseCss()).toBe('var(--surface-hover, red)')
})
