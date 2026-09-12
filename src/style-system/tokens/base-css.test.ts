/** 验证基础样式积木及混色保留对象关系，按最终顺序解析。 */
import { expect, test, vi } from 'vitest'
import { value } from '../core/derive/css-value'
import { block } from '../core/css-block'
import { boxShadow, margin, marginBottom, marginLeft, marginRight, marginTop } from './base-css'
import { variable } from '../core/derive/css-variable'
import { colorMix } from './css-color-mix'

test('变量与混色不提前解析，colors 按写入隔离且内部颜色材料共享', () => {
  const fallback = value('blue')
  const parse = vi.spyOn(fallback, 'parseCss')
  const reference = variable('example-color', fallback)
  const mixed = colorMix([reference, 0.5], value('transparent'))
  const next = mixed()
  expect(parse).not.toHaveBeenCalled()
  expect(next.colors).not.toBe(mixed.colors)
  expect(next.colors[0]).toBe(mixed.colors[0])
  const stop = next.colors[0]
  if (!Array.isArray(stop)) throw new Error('测试需要带权重的颜色')
  expect(stop[0]).toBe(reference)
  next.colors.push(value('black'))
  expect(mixed.colors).toHaveLength(2)
  expect(next.colors).toHaveLength(3)
  expect(next.parseCss()).toBe('color-mix(in oklab, var(--example-color, blue) 50%, transparent, black)')
  expect(mixed.parseCss()).toBe('color-mix(in oklab, var(--example-color, blue) 50%, transparent)')
})

test('基础方法返回 Property，四个方向分别读取值的惰性副本', () => {
  const length = value('2px')
  for (const token of [marginTop, marginRight, marginBottom, marginLeft, boxShadow]) {
    const declaration = token(length)
    expect(declaration.kind).toBe('property')
    expect(declaration.value).not.toBe(length)
    expect(declaration.value.parseCss()).toBe('2px')
    expect(declaration().key).toBe(declaration.key)
  }
  const combined = margin(length)
  expect(combined.children.map(child => 'key' in child ? child.key : '')).toEqual([
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  ])
  expect(combined.children.every(child => child.getDependencies()[0] !== length)).toBe(true)
})

test('四个方向分别激活值副本，重复激活不重复执行', () => {
  const active = vi.fn()
  const combined = margin(value('2px', { onActive: active }))
  combined.activate()
  combined.activate()
  expect(active).toHaveBeenCalledTimes(4)
  const shadow = value('none', { onActive: active })
  const parse = vi.spyOn(shadow, 'parseCss')
  combined.attach(boxShadow(shadow))
  expect(shadow.isActive).toBe(false)
  expect(active).toHaveBeenCalledTimes(5)
  expect(parse).not.toHaveBeenCalled()
})

test('普通组合保留声明顺序，不过滤重复属性或添加花括号', () => {
  const combined = block().attach(marginLeft(value('2px')), marginLeft(value('4px')))
  expect(combined.parseCss()).toBe('margin-left: 2px;\nmargin-left: 4px;')
})
