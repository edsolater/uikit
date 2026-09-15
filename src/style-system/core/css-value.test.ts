/** 检查值的激活通知与变量兜底、注册的关系。 */
import { expect, expectTypeOf, test, vi } from 'vitest'
import type { Block } from './css-block'
import { parseValue, value, type Value } from './css-value'
import { declareVariable, variable } from './css-variable'
import { padding } from '../declarations/padding'
import { font } from '../declarations/font'
import { display } from '../declarations/layout'
import { border } from '../declarations/border'
import { transition } from '../declarations/transition'
import type { Transition } from '../values/transition'
import { valueList } from '../values/list'
import { formatCommaList } from '../formatters/comma-list'

test('通用列表格式不拆开条目数组，值列表也不绑定阴影或其他属性', () => {
  const pairs = [[1, 2], [3, 4]]
  expect(formatCommaList(pairs, ([x, y]) => `${x} ${y}`)).toBe('1 2, 3 4')

  const reference = variable('second-animation')
  const animations = valueList(value('fade'), reference)
  expect(animations.items[1]).toBe(reference)
  expect(animations.parseCss()).toBe('fade, var(--second-animation)')
})

test('Value 独立保存内容，只有显式上下文能报告激活', () => {
  const active = vi.fn()
  const literal = value(0, { onActive: active })
  expectTypeOf<Value>().not.toExtend<Block>()
  expect(typeof literal).toBe('object')
  expect(parseValue(literal)).toBe('0')
  expect(active).not.toHaveBeenCalled()
  const visit = vi.fn()
  expect(parseValue(literal, { activateValue: visit })).toBe('0')
  expect(visit).toHaveBeenCalledExactlyOnceWith(literal)
})

test('变量保留兜底对象，注册以独立完整规则返回', () => {
  const fallback = value('4px')
  const gap = variable('gap', {
    fallback,
    registration: { syntax: '<length>', inherits: false, initialValue: value('8px') },
  })
  expect(gap.fallback).toBe(fallback)
  expect(typeof gap).toBe('object')
  expect(gap.name).toBe('gap')
  expect(declareVariable(gap, 'inherit').parseCss()).toBe('--gap: inherit;')
  expect(parseValue(gap)).toBe('var(--gap, 4px)')
  expect(gap.onActive?.()?.[0].parseCss()).toBe(
    '@property --gap { syntax: "<length>";\ninherits: false;\ninitial-value: 8px; }',
  )
  expect(parseValue(variable('plain'))).toBe('var(--plain)')
  expect(variable('plain').onActive).toBeUndefined()
  expect(variable('local', { fallback }).onActive).toBeUndefined()
  const visited: Value[] = []
  parseValue(gap, {
    activateValue: (current) => {
      visited.push(current)
    },
  })
  expect(visited).toEqual([gap, fallback])

  const assigned = value('12px')
  const first = declareVariable(gap, assigned)
  const second = declareVariable(gap, value('20px'))
  expect(first.kind).toBe('declaration')
  expect(first.name).toBe(second.name)
  expect(first.parseCss()).toBe('--gap: 12px;')
  expect(second.parseCss()).toBe('--gap: 20px;')
  expect(gap.fallback).toBe(fallback)
  expect(parseValue(gap)).toBe('var(--gap, 4px)')
  visited.length = 0
  first.parseCss({ activateValue: (item) => visited.push(item) })
  expect(visited).toEqual(expect.arrayContaining([gap, assigned]))
  expect(visited).not.toContain(fallback)

  const themed = variable('themed-gap', { root: { value: fallback, dark: assigned } })
  expect(themed.name).toBe('themed-gap')
  expect(declareVariable(themed, assigned).parseCss()).toBe('--themed-gap: 12px;')
  expect(parseValue(themed)).toBe('var(--themed-gap)')
  visited.length = 0
  themed.onActive?.()?.[0].parseCss({ activateValue: (item) => visited.push(item) })
  expect(visited.filter((item) => item === themed)).toHaveLength(2)
})

test('属性入口不限制关键字，按自身语法组合并保留子 Value', () => {
  const top = value('1px')
  const right = value('2px')
  const bottom = value('3px')
  const left = value('4px')
  expect(padding(top).parseCss()).toBe('padding: 1px;')
  expect(padding(top, right).parseCss()).toBe('padding: 1px 2px;')
  expect(padding(top, right, bottom).parseCss()).toBe('padding: 1px 2px 3px;')
  expect(padding(top, right, bottom, left).parseCss()).toBe('padding: 1px 2px 3px 4px;')
  expect(padding({ left }).parseCss()).toBe('padding-left: 4px;')
  expect(display('inline-flex').parseCss()).toBe('display: inline-flex;')
  expectTypeOf<Parameters<typeof display>[0]>().toEqualTypeOf<Value | string>()
  expect(display('future-keyword').parseCss()).toBe('display: future-keyword;')
  expect(border(top, 'solid', 'rebeccapurple').parseCss()).toBe('border: 1px solid rebeccapurple;')
  expect(border('rebeccapurple', top, 'solid').parseCss()).toBe('border: rebeccapurple 1px solid;')

  const size = value('16px')
  const leading = value(1.5)
  const family = value('"Example Font"')
  const typography = font({ style: 'italic', size, lineHeight: leading, family })
  const visited: Value[] = []
  expect(
    typography.parseCss({
      activateValue: (item) => {
        visited.push(item)
      },
    }),
  ).toBe('font: italic 16px/1.5 "Example Font";')
  expect(visited).toEqual(expect.arrayContaining([size, leading, family]))

  const duration = value('120ms')
  const easing = value('ease')
  const fade: Transition = ['opacity', duration, easing]
  const movement: Transition = ['transform', duration, easing]
  visited.length = 0
  expect(transition(fade, movement).parseCss({ activateValue: (item) => visited.push(item) })).toBe(
    'transition: opacity 120ms ease, transform 120ms ease;',
  )
  expect(visited).toEqual([duration, easing, duration, easing])
})
