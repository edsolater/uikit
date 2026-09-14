/** 检查值的激活通知与变量兜底、注册的关系。 */
import { expect, expectTypeOf, test, vi } from 'vitest'
import type { Block } from './css-block'
import { parseValue, value, type Value } from './css-value'
import { variable } from './css-variable'

test('Value 独立保存内容，只有显式上下文能报告激活', () => {
  const active = vi.fn()
  const literal = value(0, { onActive: active })
  expectTypeOf<Value>().not.toExtend<Block>()
  expect(parseValue(literal)).toBe('0')
  expect(active).not.toHaveBeenCalled()
  const visit = vi.fn()
  expect(parseValue(literal, { activateValue: visit })).toBe('0')
  expect(visit).toHaveBeenCalledExactlyOnceWith(literal)
})

test('变量保留兜底对象，注册以独立完整规则返回', () => {
  const fallback = value('4px')
  const gap = variable('gap', { fallback, registration: { syntax: '<length>', inherits: false, initialValue: value('8px') } })
  expect(gap.fallback).toBe(fallback)
  expect(parseValue(gap)).toBe('var(--gap, 4px)')
  expect(gap.onActive?.()?.parseCss()).toBe('@property --gap { syntax: "<length>";\ninherits: false;\ninitial-value: 8px; }')
  expect(parseValue(variable('plain'))).toBe('var(--plain)')
  expect(variable('plain').onActive).toBeUndefined()
  const visited: Value[] = []
  parseValue(gap, { activateValue: current => { visited.push(current) } })
  expect(visited).toEqual([gap, fallback])
})
