/** 在浏览器验证黑盒引用链、成员状态和局部声明。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { variable } from '../variable'
import { clusterFrom, variableCluster } from '../variable-cluster'
import { condition } from '../condition'
import { compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'
import { calcMultiply } from '../pieces/contents/combiners/calc'
import { colorMix } from '../pieces/contents/combiners/color-mix'
import { createJSSContent } from '../content'
import { focusOutline } from '../pieces/contents/atoms/focus'
import { accentColor, toneColor } from '../pieces/contents/atoms/color/tone'
import type { Rules } from '../rule'

stateCondition('chainHover', condition('&:where([data-hover])'))
stateCondition('chainActive', condition('&:where([data-active])'))
stateCondition('chainDisabled', condition('&:where([data-disabled])'))
stateCondition('specificState', condition('&[data-specific]'))
stateCondition('laterState', condition('&:where([data-later])'))

afterEach(() => document.body.replaceChildren())

test('焦点轮廓依次读取局部语气色、局部强调色和基础色', async () => {
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.AccentFocus')], 'outline', focusOutline],
    [[condition('.AccentFocus')], accentColor('line'), 'rgb(12, 34, 56)'],
    [[condition('.ToneFocus')], 'outline', focusOutline],
    [[condition('.ToneFocus')], toneColor('line'), 'rgb(56, 78, 90)'],
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
    name: 'focused-size',
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

test('Cluster 整组声明保留成员状态、嵌套局部覆盖与相邻作用域', () => {
  const target = variableCluster({
    default: variable('1px', { name: 'cluster-target-size' }),
    soft: variable('2px', { name: 'cluster-target-soft-size' }),
    strong: variable('3px', { name: 'cluster-target-strong-size' }),
    foreground: variable('black', { name: 'cluster-target-foreground-color' }),
  })
  const source = variableCluster({
    default: variable('10px', { name: 'cluster-source-size' }),
    soft: variable('20px', { name: 'cluster-source-soft-size', states: { chainHover: '25px' } }),
    strong: variable('30px', { name: 'cluster-source-strong-size' }),
    foreground: variable('red', { name: 'cluster-source-foreground-color' }),
  })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([
    [[condition('.ClusterConsumer')], 'width', target],
    [[condition('.ClusterConsumer')], 'height', target('soft')],
    [[condition('.ClusterConsumer')], 'margin-left', target('strong')],
    [[condition('.ClusterConsumer')], 'color', target('foreground')],
    [[condition('.ClusterLocal')], undefined, [[[condition('& > .ClusterConsumer')], target, source]]],
  ])
  const parent = document.body.appendChild(document.createElement('div'))
  parent.className = 'ClusterLocal'
  const local = parent.appendChild(document.createElement('div'))
  local.className = 'ClusterConsumer'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'ClusterConsumer'
  expect(getComputedStyle(local).width).toBe('10px')
  expect(getComputedStyle(local).height).toBe('20px')
  expect(getComputedStyle(local).marginLeft).toBe('30px')
  expect(getComputedStyle(local).color).toBe('rgb(255, 0, 0)')
  local.dataset.hover = ''
  expect(getComputedStyle(local).height).toBe('25px')
  expect(getComputedStyle(neighbor).width).toBe('1px')
  expect(getComputedStyle(neighbor).height).toBe('2px')
})

test('未匹配的函数 source 成员在局部 Cluster 声明后读取当前 default', () => {
  const toneColorDefault = variable('blue', { name: 'browser-tone-color' })
  const toneColor = variableCluster({
    default: toneColorDefault,
    soft: variable('lightblue', { name: 'browser-tone-color-soft' }),
    line: variable(
      () => colorMix([toneColorDefault, 0.32], 'transparent'),
      { name: 'browser-tone-color-line' },
    ),
  })
  const accentColor = variableCluster({
    default: variable('red', { name: 'browser-accent-color' }),
    soft: variable('pink', { name: 'browser-accent-color-soft' }),
  })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([
    [[condition('.LazyVariableButton')], 'background', toneColor('line')],
    [[condition('.LazyVariableButton'), condition('&[data-tone="accent"]')], toneColor, accentColor],
  ])

  const ordinary = document.body.appendChild(document.createElement('div'))
  ordinary.className = 'LazyVariableButton'
  const accent = document.body.appendChild(document.createElement('div'))
  accent.className = 'LazyVariableButton'
  accent.dataset.tone = 'accent'
  const ordinaryReference = document.body.appendChild(document.createElement('div'))
  ordinaryReference.style.background = 'color-mix(in oklab, blue 32%, transparent)'
  const accentReference = document.body.appendChild(document.createElement('div'))
  accentReference.style.background = 'color-mix(in oklab, red 32%, transparent)'

  expect(getComputedStyle(ordinary).backgroundColor).toBe(getComputedStyle(ordinaryReference).backgroundColor)
  expect(getComputedStyle(accent).backgroundColor).toBe(getComputedStyle(accentReference).backgroundColor)
  expect(getComputedStyle(accent).backgroundColor).not.toBe(getComputedStyle(ordinary).backgroundColor)
})

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

test('来源当前状态由外层内容状态固定，普通来源独立按浏览器状态变化', () => {
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
  expect(getComputedStyle(element).marginRight).toBe('20px')
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
  const sourceCluster = variableCluster({ default: source, soft: variable('11px', { name: 'chain-source-soft-size', states: { chainHover: '17px' } }) })
  const derived = clusterFrom(sourceCluster, {
    default: { name: 'chain-derived-size', states: { chainActive: source => calcMultiply(source, 2) } },
    soft: { name: 'chain-derived-soft-size', states: { chainActive: '19px' } },
  })
  const cluster = clusterFrom(derived, {
    default: { name: 'chain-final-size', states: { chainHover: '25px' } },
    soft: { name: 'chain-final-soft-size' },
  })
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([
    [[condition('.Chain')], 'width', cluster],
    [[condition('.ChainSoft')], 'width', cluster('soft')],
    [[condition('.Source')], 'width', sourceCluster],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Chain'
  const soft = document.body.appendChild(document.createElement('div'))
  soft.className = 'ChainSoft'
  const original = document.body.appendChild(document.createElement('div'))
  original.className = 'Source'
  expect(getComputedStyle(element).width).toBe('10px')
  expect(getComputedStyle(soft).width).toBe('11px')
  element.dataset.hover = ''
  soft.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('25px')
  expect(getComputedStyle(soft).width).toBe('17px')
  element.dataset.active = ''
  soft.dataset.active = ''
  expect(getComputedStyle(element).width).toBe('60px')
  expect(getComputedStyle(soft).width).toBe('19px')
  element.dataset.disabled = ''
  expect(getComputedStyle(element).width).toBe('0px')
  expect(getComputedStyle(original).width).toBe('10px')
  original.dataset.active = ''
  expect(getComputedStyle(original).width).toBe('30px')
})

test('有状态来源在派生状态内容中取配置值，不随来源局部覆盖变化', () => {
  const source = variable('10px', { name: 'scope-source-size', states: { chainActive: '30px' } })
  const derived = clusterFrom(variableCluster({ default: source, extra: variable('4px', { name: 'scope-extra-size' }) }), {
    default: { name: 'scope-derived-size', states: { chainActive: source => calcMultiply(source, 2) } },
  })
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
  expect(getComputedStyle(local).width).toBe('60px')
  expect(getComputedStyle(neighbor).width).toBe('60px')
})

test('状态内容只采用自身状态，并将两个来源按当前状态编译组合', () => {
  const palette = variable('gray', { name: 'context-palette-color', states: { chainHover: 'blue', chainActive: 'red' } })
  const surface = variable('white', { name: 'context-surface-color', states: { chainHover: palette } })
  const first = variable('10px', { name: 'context-first-size', states: { chainHover: '20px', chainActive: '30px' } })
  const second = variable('1px', { name: 'context-second-size', states: { chainHover: '3px', chainActive: '5px' } })
  const missing = variable('7px', { name: 'context-missing-size', states: { chainActive: '9px' } })
  const combined = variable('1px', {
    name: 'context-combined-size',
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
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 0, 255)')
  expect(getComputedStyle(element).width).toBe('30px')
  expect(getComputedStyle(independent).color).toBe('rgb(255, 0, 0)')
  delete element.dataset.hover
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 255, 255)')
  expect(getComputedStyle(element).width).toBe('1px')
})

test('状态读取无状态来源的默认内容，普通引用仍读取局部 CSS 声明', () => {
  const source = variable('5px', { name: 'context-local-source-size' })
  const derived = variable('1px', {
    name: 'context-local-derived-size',
    states: { chainHover: createJSSContent((resolve) => `calc(${resolve(source)} * 2)`, [source]) },
  })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.LocalContext')], 'width', derived],
    [[condition('.LocalContext')], 'height', source],
    [[condition('.LocalContext')], source, '7px'],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'LocalContext'
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('10px')
  expect(getComputedStyle(element).height).toBe('7px')
})

test('首次只在显式 hover Rule 消费时也固定选中内容的来源状态', () => {
  const palette = variable('gray', { name: 'explicit-palette-color', states: { chainHover: 'blue', chainActive: 'red' } })
  const surface = variable('white', { name: 'explicit-surface-color', states: { chainHover: palette } })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.ExplicitContext'), 'chainHover'], 'background-color', surface],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'ExplicitContext'
  element.dataset.hover = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 0, 255)')
  element.dataset.active = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 0, 255)')
})

test('显式 active Rule 内生成的 surface.hover 仍按 hover 取来源内容', () => {
  const palette = variable('gray', { name: 'nested-palette-color', states: { chainHover: 'blue', chainActive: 'red' } })
  const surface = variable('white', { name: 'nested-surface-color', states: { chainHover: palette } })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[condition('.NestedContext'), 'chainActive'], 'background-color', surface],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'NestedContext'
  element.dataset.active = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 255, 255)')
  element.dataset.hover = ''
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 0, 255)')
})
