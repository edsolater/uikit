/** 来源：adjust 对完整定义的最终结果统一加工，固定值与规则均不能绕过加工。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { adjust, condition, declare, key, modification, modify, multiply, oklch, variable, variableFrom } from '../index'
import { compileRules } from '../css-root'
import { whenSettled } from './when-settled'

afterEach(() => document.body.replaceChildren())

test('整份颜色加工覆盖默认、固定状态、规则状态和变体，来源不变且不重复加工', async () => {
  const source = variable('oklch(0.6 0.1 240)', {
    name: 'whole-adjust-source',
    address: [condition('.AdjustProbe')],
    states: {
      hover: 'oklch(0.4 0.1 200)',
      '&[data-active]': base => oklch(base, { alpha: current => multiply(current, 0.8) }),
    },
    variants: {
      fixed: 'oklch(0.3 0.1 140)',
      soft: base => oklch(base, { lightness: current => multiply(current, 0.5) }),
    },
  })
  const result = adjust(source, modification({ type: 'color', detail: { alpha: current => multiply(current, 0.5) } }))
  const fixed = result.variant('fixed')
  const soft = result.variant('soft')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.AdjustProbe'], 'color', result],
    [['.AdjustProbe'], 'background-color', fixed],
    [['.AdjustProbe'], 'border-color', soft],
    [['.AdjustProbe'], 'outline-color', source],
  ])
  const element = document.body.appendChild(document.createElement('button'))
  element.className = 'AdjustProbe'
  element.textContent = '整体加工'
  const colors = () => {
    const style = getComputedStyle(element)
    return [style.color, style.backgroundColor, style.borderTopColor, style.outlineColor]
  }
  expect(colors()).toEqual([
    'oklch(0.6 0.1 240 / 0.5)', 'oklch(0.3 0.1 140 / 0.5)',
    'oklch(0.3 0.1 240 / 0.5)', 'oklch(0.6 0.1 240)',
  ])
  await userEvent.hover(element)
  expect(colors()).toEqual([
    'oklch(0.4 0.1 200 / 0.5)', 'oklch(0.4 0.1 200 / 0.5)',
    'oklch(0.4 0.1 200 / 0.5)', 'oklch(0.4 0.1 200)',
  ])
  await userEvent.unhover(element)
  element.dataset.active = ''
  expect(colors()).toEqual([
    'oklch(0.6 0.1 240 / 0.4)', 'oklch(0.3 0.1 140 / 0.4)',
    'oklch(0.3 0.1 240 / 0.4)', 'oklch(0.6 0.1 240 / 0.8)',
  ])
  delete element.dataset.active
  expect(colors()[0]).toBe('oklch(0.6 0.1 240 / 0.5)')
})

test('天然来源仍可直接加工，连续加工按顺序累计而不改写来源', () => {
  const source = { key: key('--whole-adjust-natural'), content: 'oklch(0.6 0.1 240)' }
  const half = modification({ type: 'color', detail: { alpha: current => multiply(current, 0.5) } })
  const first = adjust(source, half)
  const second = adjust(first, half)
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.NaturalAdjust'], 'color', first], [['.NaturalAdjust'], 'background-color', second],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'NaturalAdjust'
  expect(getComputedStyle(element).color).toBe('oklch(0.6 0.1 240 / 0.5)')
  expect(getComputedStyle(element).backgroundColor).toBe('oklch(0.6 0.1 240 / 0.25)')
  expect(source.content).toBe('oklch(0.6 0.1 240)')
})

test.each(['显式声明', 'CSS运行时覆盖'])('调整引用来源根据地当前值，%s改蓝后无需重建调整结果', mode => {
  const source = variable('red', 'current-adjust-source')
  const result = adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    ...(mode === '显式声明' ? [[[':root'], ...declare(source, 'blue')] as Parameters<typeof compileRules>[0][number]] : []),
    [['.CurrentAdjustSource'], 'color', result],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'CurrentAdjustSource'
  try {
    if (mode === 'CSS运行时覆盖') document.documentElement.style.setProperty(source.toCSSString(), 'blue')
    expect(getComputedStyle(element).color).toBe('oklch(0.451981 0.31321 264.051 / 0.5)')
  } finally {
    document.documentElement.style.removeProperty(source.toCSSString())
  }
})

test('完整修改使用变体根据地的有效新定义，其他同名对象按优先级覆盖', () => {
  const source = variable('red', { name: 'variant-choice-source', address: '.VariantChoice', variants: { line: 'green' } })
  const line = source.variant('line')
  const stronger = variable('black', { name: line.name, address: '.VariantChoice', priority: line.priority + 1 })
  const compile = (withStronger: boolean) => compileRules([
    [['.VariantChoice'], ...declare(line, 'blue')],
    [['.VariantChoice'], ...declare(line, 'gold')],
    ...(withStronger ? [[['.VariantChoice'], ...declare(stronger, 'black')] as Parameters<typeof compileRules>[0][number]] : []),
    [['.VariantChoice'], ...modify(source, modification({ type: 'color', detail: { alpha: 0.5 } }))],
    [['.VariantChoice'], 'color', line],
  ])
  const style = document.body.appendChild(document.createElement('style'))
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'VariantChoice'
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'oklch(from gold l c h / 0.5)'
  style.textContent = compile(false)
  expect(getComputedStyle(element).color).toBe(getComputedStyle(reference).color)
  style.textContent = compile(true)
  expect(getComputedStyle(element).color).toBe('oklch(0 0 0 / 0.5)')
})

test.each(['variableFrom', 'variant', 'adjust'])('%s 沿用来源根据地，状态由该主体控制而不从消费处猜地址', async kind => {
  const source = variable('red', { name: `inherited-home-${kind}`, address: '.InheritedHome', states: { hover: 'blue' }, variants: { line: 'gold' } })
  const result = kind === 'variableFrom' ? variableFrom(source, 'green')
    : kind === 'variant' ? source.variant('line')
    : adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  document.body.appendChild(document.createElement('style')).textContent = compileRules([[['.HomeConsumer'], 'color', result]])
  const parent = document.body.appendChild(document.createElement('button'))
  parent.className = 'InheritedHome'
  const child = parent.appendChild(document.createElement('span'))
  child.className = 'HomeConsumer'
  child.textContent = '根据地后代'
  const outside = document.body.appendChild(document.createElement('span'))
  outside.className = 'HomeConsumer'
  outside.style.color = `var(${result.toCSSString()}, black)`
  outside.textContent = '根据地之外'
  expect(getComputedStyle(child).color).not.toBe(getComputedStyle(outside).color)
  await userEvent.hover(parent)
  expect(getComputedStyle(child).color).toBe(kind === 'adjust' ? 'oklch(0.451981 0.31321 264.051 / 0.5)' : 'rgb(0, 0, 255)')
  expect(getComputedStyle(outside).color).toBe('rgb(0, 0, 0)')
  await userEvent.unhover(parent)
})

test('晚到的变体基础替换后，完整修改采用新的有效定义', () => {
  const source = variable('red', { name: 'late-variant-source', address: '.LateVariant', variants: { line: 'green' } })
  const line = source.variant('line')
  const operation = modify(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  const css = compileRules([
    [['.LateVariant'], ...declare(line, 'blue')], [['.LateVariant'], ...operation],
    [['.LateVariant'], 'color', line],
    [[], undefined, whenSettled(controller => {
      const anchor = controller.search({ key: source.key }).find(node => node.content === operation[1])!
      controller.insert({ before: anchor, conditionPath: anchor.conditionPath }, declare(line, 'gold'), { owner: anchor })
      return true
    })],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'LateVariant'
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'oklch(from gold l c h / 0.5)'
  expect(getComputedStyle(element).color).toBe(getComputedStyle(reference).color)
})

test('晚到后写的新绑定截断先前修改及其变体加工', () => {
  const source = variable('red', { name: 'late-binding-source', address: '.LateBinding', variants: { line: 'green' } })
  const line = source.variant('line')
  const operation = modify(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  const css = compileRules([
    [['.LateBinding'], ...operation], [['.LateBinding'], 'color', source], [['.LateBinding'], 'background-color', line],
    [[], undefined, whenSettled(controller => {
      const anchor = controller.search({ key: source.key }).find(node => node.content === operation[1])!
      controller.insert({ after: anchor, conditionPath: anchor.conditionPath }, declare(source, 'gold'), { owner: anchor })
      anchor.compileRevision++
      return true
    })],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'LateBinding'
  expect(getComputedStyle(element).color).toBe('rgb(255, 215, 0)')
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 128, 0)')
})

test('从已加工定义复用新基础时只加工一次，不保留来源当前值绑定', async () => {
  const source = variable('red', { name: 'from-adjust-source', address: '.FromAdjust', states: { hover: 'blue' }, variants: { line: 'gold' } })
  const adjusted = adjust(source, modification({ type: 'color', detail: { alpha: current => multiply(current, 0.5) } }))
  const copied = variableFrom(adjusted, 'green', 'from-adjust-new')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([[['.FromAdjust'], 'color', copied]])
  const element = document.body.appendChild(document.createElement('button'))
  element.className = 'FromAdjust'
  element.textContent = '独立新基础'
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'oklch(from green l c h / 0.5)'
  expect(getComputedStyle(element).color).toBe(getComputedStyle(reference).color)
  await userEvent.hover(element)
  expect(getComputedStyle(element).color).toBe('oklch(0.451981 0.31321 264.051 / 0.5)')
  await userEvent.unhover(element)
})

