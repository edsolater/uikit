/** 在浏览器验证黑盒引用链、成员状态和局部声明。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { variable, variableFrom } from './css-variable'
import { variableCluster } from './variable-cluster'
import { condition } from './css-condition'
import { compileRules } from '../compiler/compile-css'
import { stateCondition } from '../state-conditions'
import { calcMultiply } from '../values/functions/calc'
import { colorMix } from '../values/functions/color-mix'
import type { Rules } from './css-rule'

stateCondition('chainHover', condition('&:where([data-hover])'))
stateCondition('chainActive', condition('&:where([data-active])'))
stateCondition('chainDisabled', condition('&:where([data-disabled])'))
stateCondition('specificState', condition('&[data-specific]'))
stateCondition('laterState', condition('&:where([data-later])'))

afterEach(() => document.body.replaceChildren())

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
