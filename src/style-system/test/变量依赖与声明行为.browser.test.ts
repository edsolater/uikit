/** 根据地状态使用该处基础，variableFrom保留原始规则；通过浏览器验证显式赋值与层叠。 */

import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { add, multiply } from '../pieces/contents/functions/calc'
import { variable, variableFrom } from '../variable'

import { key } from '../key'
import type { ValueInput } from '../value'

afterEach(() => document.body.replaceChildren())

/**
 * 将本例的一次编译 CSS 与明确选择器元素挂到浏览器，断言仍由各场景直接表达。
 */
function mountCSS(css: string, className: string, tag = 'div'): HTMLElement {
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement(tag))
  element.className = className
  return element
}

test('普通Key两次声明保留join，非根据地同名对象不发布状态', () => {
  const source = variable('10px', { name: 'joined-key-state', states: { '&[data-phase]': base => multiply(base, 2) } })
  const target = key('--joined-key-state', { join: values => values.reduce<ValueInput>((total, item) => add(total, item), '0px') })
  const lower = variable('100px', { name: source.name, priority: 998, states: { '&[data-phase]': '100px' } })
  const css = compileRules([
    [['.Parent'], 'width', source],
    [['.Child'], ...declare(target, '3px')], [['.Child'], ...declare(target, '4px')],
    [['.Child'], ...declare(lower)], [['.Child'], 'width', 'var(--joined-key-state)'],
  ])
  const element = mountCSS(css, 'Child')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('7px')
})

test('低等级后写声明不把高等级基础移到零附加权重状态之后', async () => {
  const high = variable('red', { name: 'priority-state-anchor', address: '.Probe', priority: 6, states: { hover: 'gold' } })
  const low = variable('blue', { name: high.name, priority: 5 })
  const css = compileRules([
    [['.Probe'], ...declare(high)], [['.Probe'], ...declare(low)],
    [['.Probe'], 'color', 'var(--priority-state-anchor)'],
  ])
  const element = mountCSS(css, 'Probe', 'button')
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
  await userEvent.hover(element)
  expect(getComputedStyle(element).color).toBe('rgb(255, 215, 0)')
  await userEvent.unhover(element)
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
})

test.each(['Variable', 'Key'])('同名%s declare 后，不借用另一对象状态，保持当地7px', (entry) => {
  const source = variable('10px', { name: 'shared-state-size', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const local = entry === 'Key' ? key('--shared-state-size') : variable('1px', { name: 'shared-state-size', priority: 1 })
  const css = compileRules([
    [['.Parent'], 'width', source], [['.Child'], ...declare(local, '7px')],
    [['.Child'], 'width', 'var(--shared-state-size)'],
  ])
  const element = mountCSS(css, 'Child')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('7px')
  delete element.dataset.phase
  expect(getComputedStyle(element).width).toBe('7px')
})

test('根据地只 declare 也展开自身states，显式7px基础在状态下得到14px', () => {
  const size = variable('10px', {
    name: 'base-local-size', address: '.Local', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const css = compileRules([
    [['.Local'], ...declare(size, '7px')],
    // 原生引用不激活 Variable 依赖消费，状态必须由 declare 自己提供。
    [['.Local'], 'width', 'var(--base-local-size)'],
  ])
  const element = mountCSS(css, 'Local')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('14px')
  delete element.dataset.phase
  expect(getComputedStyle(element).width).toBe('7px')
  expect(css).not.toContain('--base-local-size: var(--base-local-size);')
})

test('variableFrom 继承名称和默认内容，保留原始状态规则', () => {
  const source = variable('10px', {
    name: 'base-inherited-size', address: ".Inherited", priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const inherited = variableFrom(source, source.content)
  expect(inherited.name).toBe(source.name)
  const css = compileRules([
        [['.Inherited'], 'width', inherited],
  ])
  const element = mountCSS(css, 'Inherited')
  expect(getComputedStyle(element).width).toBe('10px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('20px')
})

test('variableFrom的新基础重绑继承规则，非根据地declare只赋当地值', () => {
  const source = variable('10px', {
    name: 'base-original-size', address: ".Source", priority: 0,
    states: {
      '&[data-phase]': base => multiply(base, 2),
      '&[data-other]': base => multiply(base, 3),
    },
  })
  const larger = variableFrom(source, '20px', { address: '.Larger', states: { '&[data-other]': '50px' } })
  const css = compileRules([
        [['.Larger'], 'width', larger],
    [['.LocalLarger'], ...declare(larger, '7px')],
    [['.LocalLarger'], 'width', `var(${larger.toCSSString()})`],
    [['.Source'], 'width', source],
  ])
  const inherited = mountCSS(css, 'Larger')
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'LocalLarger'
  expect(getComputedStyle(inherited).width).toBe('20px')
  expect(getComputedStyle(local).width).toBe('7px')
  inherited.dataset.phase = ''
  local.dataset.phase = ''
  expect(getComputedStyle(inherited).width).toBe('40px')
  expect(getComputedStyle(local).width).toBe('7px')
  inherited.dataset.other = ''
  expect(getComputedStyle(inherited).width).toBe('50px')
  delete inherited.dataset.other
  expect(getComputedStyle(inherited).width).toBe('40px')
})
