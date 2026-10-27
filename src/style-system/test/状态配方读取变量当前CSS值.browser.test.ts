/** 在浏览器验证状态配方引用当前 CSS 值及局部覆盖。 */
import { token } from '../token'
import { afterEach, expect, test } from 'vitest'
import { condition } from '../condition'
import { compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'
import { multiply } from '../pieces/functions/calc'

stateCondition('currentHover', condition('&:where([data-hover])'))
stateCondition('currentActive', condition('&:where([data-active])'))

afterEach(() => document.body.replaceChildren())

test('状态配方将来源的局部7px乘2，直接派生也读取局部值', () => {
  const source = token('5px', 'current-local-source-size')
  const direct = token(source, {
    name: 'current-local-direct-size',
    address: '.LocalContext',
  })
  const derived = token('1px', {
    name: 'current-local-derived-size',
    address: '.LocalContext',
    state: { currentHover: multiply(source, 2) },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [[condition('.LocalContext')], 'width', derived],
      [[condition('.LocalContext')], 'height', source],
      [[condition('.LocalContext')], 'margin-left', direct],
      [[condition('.LocalContext')], source, '7px'],
    ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'LocalContext'
  expect(getComputedStyle(element).height).toBe('7px')
  expect(getComputedStyle(element).marginLeft).toBe('7px')
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('14px')
})

test('外层hover引用来源当前active值，来源独立按浏览器状态变化', () => {
  const inner = token('10px', {
    name: 'current-inner-size',
    address: '.Ordered',
    state: { currentHover: '20px', currentActive: '30px' },
  })
  const active = token('1px', {
    name: 'current-active-size',
    address: '.Ordered',
    state: { currentActive: inner },
  })
  const hover = token('2px', {
    name: 'current-hover-size',
    address: '.Ordered',
    state: { currentHover: inner },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [[condition('.Ordered')], 'margin-left', active],
      [[condition('.Ordered')], 'margin-right', hover],
      [[condition('.Ordered')], 'width', inner],
    ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Ordered'
  expect(getComputedStyle(element).width).toBe('10px')
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('20px')
  expect(getComputedStyle(element).marginRight).toBe('20px')
  element.dataset.active = ''
  expect(getComputedStyle(element).width).toBe('30px')
  expect(getComputedStyle(element).marginLeft).toBe('30px')
  expect(getComputedStyle(element).marginRight).toBe('30px')
  delete element.dataset.hover
  expect(getComputedStyle(element).width).toBe('30px')
  expect(getComputedStyle(element).marginRight).toBe('2px')
})

test('仅在状态配方中引用的来源保留注册初始值', () => {
  const source = token('10px', {
    name: 'current-registered-source-size',
    registration: { syntax: '<length>', inherits: false, initialValue: '17px' },
  })
  const target = token('1px', {
    name: 'current-registered-target-size',
    address: '.RegisteredContext',
    state: { currentHover: multiply(source, 2) },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([[[condition('.RegisteredContext')], 'width', target]])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'RegisteredContext'
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('34px')
})
