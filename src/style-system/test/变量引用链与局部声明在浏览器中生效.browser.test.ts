/** 在浏览器验证黑盒引用链、成员状态和局部声明。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { variable } from '../variable'
import { condition } from '../condition'
import { compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'

import { createJSSContent } from '../content'
import { focusOutline } from '../pieces/contents/atoms/focus'
import type { Rules } from '../rule'

stateCondition('chainHover', condition('&:where([data-hover])'))
stateCondition('chainActive', condition('&:where([data-active])'))
stateCondition('chainDisabled', condition('&:where([data-disabled])'))
stateCondition('specificState', condition('&[data-specific]'))
stateCondition('laterState', condition('&:where([data-later])'))

afterEach(() => document.body.replaceChildren())

test('焦点轮廓读取调用者选择的具体颜色，局部声明保持独立', async () => {
  const accent = variable('black', 'focus-accent')
  const tone = variable('gray', 'focus-tone')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.AccentFocus')], 'outline', focusOutline(accent, '.AccentFocus')],
    [[condition('.AccentFocus')], accent, 'rgb(12, 34, 56)'],
    [[condition('.ToneFocus')], 'outline', focusOutline(tone, '.ToneFocus')],
    [[condition('.ToneFocus')], tone, 'rgb(56, 78, 90)'],
  ])
  const accentButton = document.body.appendChild(document.createElement('button'))
  accentButton.className = 'AccentFocus'
  const toneButton = document.body.appendChild(document.createElement('button'))
  toneButton.className = 'ToneFocus'
  await userEvent.tab()
  expect(accentButton.matches(':focus-visible')).toBe(true)
  expect(getComputedStyle(accentButton).outlineColor).toBe('rgb(12, 34, 56)')
  await userEvent.tab()
  expect(toneButton.matches(':focus-visible')).toBe(true)
  expect(getComputedStyle(toneButton).outlineColor).toBe('rgb(56, 78, 90)')
})

test('真实 focusVisible 低于 hover 和 active，鼠标 focus 不等于 focusVisible', async () => {
  const width = variable('10px', {
    name: 'focused-size', address: ".Focused",
    states: { focus: '12px', hover: '20px', active: '30px' },
  })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([[[condition('.Focused')], 'width', width]])
  const element = document.body.appendChild(document.createElement('button'))
  element.className = 'Focused'
  element.style.padding = '0'
  element.style.border = '0'
  element.textContent = '焦点状态'
  await userEvent.click(element)
  await userEvent.unhover(element)
  expect(element.matches(':focus')).toBe(true)
  expect(element.matches(':focus-visible')).toBe(false)
  expect(getComputedStyle(element).width).toBe('10px')
  await userEvent.keyboard('[ArrowRight]')
  expect(element.matches(':focus-visible')).toBe(true)
  expect(getComputedStyle(element).width).toBe('12px')
  await userEvent.hover(element)
  expect(getComputedStyle(element).width).toBe('20px')
  await userEvent.keyboard('[Space>]')
  try {
    expect(element.matches(':focus-visible:hover:active')).toBe(true)
    expect(getComputedStyle(element).width).toBe('30px')
    await userEvent.unhover(element)
    expect(getComputedStyle(element).width).toBe('30px')
  } finally { await userEvent.keyboard('[/Space]') }
  expect(getComputedStyle(element).width).toBe('12px')
})

test.each([false, true])('首次状态内引用与普通消费的顺序不改变浏览器结果：%s', (ordinaryFirst) => {
  const inner = variable('10px', { name: 'audit-inner-size', address: ".Audit", states: { chainHover: '20px' } })
  const outer = variable('1px', { name: 'audit-outer-size', address: ".Audit", states: { chainHover: inner } })
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

test('较早状态的高特异性不能压过较晚状态', () => {
  const size = variable('10px', { name: 'priority-size', address: ".Priority", states: { specificState: '20px', laterState: '30px' } })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([[[condition('.Priority')], 'width', size]])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Priority'
  element.dataset.specific = ''
  element.dataset.later = ''
  expect(getComputedStyle(element).width).toBe('30px')
})

test('状态内容组合各来源当前 CSS 状态值', () => {
  const palette = variable('gray', { name: 'context-palette-color', address: ".StateContext, .IndependentPalette", states: { chainHover: 'blue', chainActive: 'red' } })
  const surface = variable('white', { name: 'context-surface-color', address: ".StateContext", states: { chainHover: palette } })
  const first = variable('10px', { name: 'context-first-size', address: ".StateContext", states: { chainHover: '20px', chainActive: '30px' } })
  const second = variable('1px', { name: 'context-second-size', address: ".StateContext", states: { chainHover: '3px', chainActive: '5px' } })
  const missing = variable('7px', { name: 'context-missing-size', address: ".StateContext", states: { chainActive: '9px' } })
  const combined = variable('1px', {
    name: 'context-combined-size', address: ".StateContext",
    states: { chainHover: createJSSContent((resolve) => `calc(${resolve(first)} + ${resolve(second)} + ${resolve(missing)})`, [first, second, missing]) },
  })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.StateContext')], 'background-color', surface],
    [[condition('.StateContext')], 'width', combined],
    [[condition('.IndependentPalette')], 'color', palette],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'StateContext'
  const independent = document.body.appendChild(document.createElement('div'))
  independent.className = 'IndependentPalette'
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 255, 255)')
  expect(getComputedStyle(element).width).toBe('1px')
  element.dataset.hover = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 0, 255)')
  expect(getComputedStyle(element).width).toBe('30px')
  element.dataset.active = ''
  independent.dataset.active = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 0, 0)')
  expect(getComputedStyle(element).width).toBe('44px')
  expect(getComputedStyle(independent).color).toBe('rgb(255, 0, 0)')
  delete element.dataset.hover
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 255, 255)')
  expect(getComputedStyle(element).width).toBe('1px')
})

test('普通 hover 条件中的状态配方引用来源当前状态', () => {
  const palette = variable('gray', { name: 'explicit-palette-color', address: ".ExplicitContext", states: { chainHover: 'blue', chainActive: 'red' } })
  const surface = variable('white', { name: 'explicit-surface-color', address: ".ExplicitContext", states: { chainHover: palette } })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.ExplicitContext'), condition('&:where([data-hover])')], 'background-color', surface],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'ExplicitContext'
  element.dataset.hover = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 0, 255)')
  element.dataset.active = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 0, 0)')
})

test('普通 active 条件内的 hover 配方读取来源 active 值', () => {
  const palette = variable('gray', { name: 'nested-palette-color', address: ".NestedContext", states: { chainHover: 'blue', chainActive: 'red' } })
  const surface = variable('white', { name: 'nested-surface-color', address: ".NestedContext", states: { chainHover: palette } })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.NestedContext'), condition('&:where([data-active])')], 'background-color', surface],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'NestedContext'
  element.dataset.active = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 255, 255)')
  element.dataset.hover = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 0, 0)')
})
