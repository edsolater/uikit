/** 在浏览器验证黑盒引用链、成员状态和局部声明。 */
import { afterEach, expect, test } from 'vitest'
import { variable, variableFrom } from './css-variable'
import { variableCluster } from './variable-cluster'
import { condition } from './css-condition'
import { compileRules } from '../compiler/compile-css'
import { stateCondition } from '../state-conditions'
import { calcMultiply } from '../values/functions/calc'
import type { Rules } from './css-rule'

stateCondition('chainHover', condition('&:where([data-hover])'))
stateCondition('chainActive', condition('&:where([data-active])'))
stateCondition('chainDisabled', condition('&:where([data-disabled])'))
stateCondition('specificState', condition('&[data-specific]'))
stateCondition('laterState', condition('&:where([data-later])'))

afterEach(() => document.body.replaceChildren())

test.each([false, true])('首次状态内引用与普通消费的顺序不改变浏览器结果：%s', (ordinaryFirst) => {
  const inner = variable('10px', { name: 'audit-inner-size', states: { chainHover: '20px' } })
  const outer = variable('1px', { name: 'audit-outer-size', states: { chainHover: inner } })
  const rules: Rules = [
    [[condition('.Audit')], 'margin-left', outer],
    [[condition('.Audit')], 'width', inner],
  ]
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules(ordinaryFirst ? rules.reverse() : rules)
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Audit'
  expect(getComputedStyle(element).width).toBe('10px')
  expect(getComputedStyle(element).marginLeft).toBe('1px')
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('20px')
  expect(getComputedStyle(element).marginLeft).toBe('20px')
  delete element.dataset.hover
  expect(getComputedStyle(element).width).toBe('10px')
  expect(getComputedStyle(element).marginLeft).toBe('1px')
})

test('依赖的状态发现顺序不改变默认值、状态优先级及交集', () => {
  const inner = variable('10px', { name: 'ordered-inner-size', states: { chainHover: '20px', chainActive: '30px' } })
  const active = variable('1px', { name: 'ordered-active-size', states: { chainActive: inner } })
  const hover = variable('2px', { name: 'ordered-hover-size', states: { chainHover: inner } })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([
    [[condition('.Ordered')], 'margin-left', active],
    [[condition('.Ordered')], 'margin-right', hover],
    [[condition('.Ordered')], 'width', inner],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Ordered'
  expect(getComputedStyle(element).width).toBe('10px')
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('20px')
  element.dataset.active = ''
  expect(getComputedStyle(element).width).toBe('30px')
  expect(getComputedStyle(element).marginLeft).toBe('30px')
  expect(getComputedStyle(element).marginRight).toBe('30px')
  delete element.dataset.hover
  expect(getComputedStyle(element).width).toBe('30px')
})

test('较早状态的高特异性不能压过较晚状态', () => {
  const size = variable('10px', { name: 'priority-size', states: { specificState: '20px', laterState: '30px' } })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([[[condition('.Priority')], 'width', size]])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Priority'
  element.dataset.specific = ''
  element.dataset.later = ''
  expect(getComputedStyle(element).width).toBe('30px')
})

test('多层延伸使用自身状态，其余沿链查找；source 直接使用当前状态值', () => {
  const source = variable('10px', {
    name: 'chain-source-size',
    states: { chainHover: '20px', chainActive: '30px', chainDisabled: '0px' },
  })
  const derived = variableFrom(source, {
    name: 'chain-derived-size',
    states: { chainActive: source => calcMultiply(source, 2) },
  })
  const final = variableFrom(derived, { name: 'chain-final-size', states: { chainHover: '25px' } })
  const cluster = variableCluster({ default: source, soft: final })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([[[condition('.Chain')], 'width', cluster('soft')], [[condition('.Source')], 'width', cluster]])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Chain'
  const original = document.body.appendChild(document.createElement('div'))
  original.className = 'Source'
  expect(getComputedStyle(element).width).toBe('10px')
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('25px')
  element.dataset.active = ''
  expect(getComputedStyle(element).width).toBe('60px')
  element.dataset.disabled = ''
  expect(getComputedStyle(element).width).toBe('0px')
  expect(getComputedStyle(original).width).toBe('10px')
  original.dataset.active = ''
  expect(getComputedStyle(original).width).toBe('30px')
})

test('局部声明由浏览器解释，不改写共享 Variable 或相邻主体', () => {
  const source = variable('10px', { name: 'scope-source-size', states: { chainActive: '30px' } })
  const derived = variableFrom(source, { name: 'scope-derived-size', states: { chainActive: source => calcMultiply(source, 2) } })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([
    [[condition('.Consumer')], 'width', derived],
    [[condition('.Local')], source, '7px'],
  ])
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'Consumer Local'
  local.dataset.active = ''
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'Consumer'
  neighbor.dataset.active = ''
  expect(getComputedStyle(local).width).toBe('14px')
  expect(getComputedStyle(neighbor).width).toBe('60px')
})
