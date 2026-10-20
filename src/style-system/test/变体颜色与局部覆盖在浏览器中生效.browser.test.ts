/** 验证变体颜色、真实hover与共享引用，并以普通Variable作对照。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileRules } from '../css-root'
import { variable } from '../variable'
import type { ValueInput } from '../value'
import { oklch } from '../pieces/contents/functions/oklch'
import { multiply, add } from '../pieces/contents/functions/calc'

const contentColor = (base: ValueInput) => oklch(base, { lightness: current => multiply(current, 0.5) })
const hoverColor = (base: ValueInput) => oklch(base, { lightness: current => add(current, -0.04) })

afterEach(() => document.body.replaceChildren())

function button(className: string) {
  const element = document.body.appendChild(document.createElement('button'))
  element.className = className
  element.textContent = '变体按钮'
  return element
}

/** 浏览器统一到OKLCH通道后比较，避免等效颜色序列化差异。 */
function expectColor(actual: string, expected: string) {
  const channels = (input: string) => {
    const probe = document.body.appendChild(document.createElement('span'))
    probe.style.color = `oklch(from ${input} l c h)`
    const values = getComputedStyle(probe).color.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)!.map(Number)
    probe.remove()
    return values
  }
  const left = channels(actual)
  const right = channels(expected)
  expect(left).toHaveLength(3)
  expect(right).toHaveLength(3)
  left.forEach((value, index) => expect(value).toBeCloseTo(right[index], 4))
}

test('正控制：普通Variable的颜色转换与真实hover得到0.3和0.26明度', async () => {
  const content = variable(contentColor('oklch(0.6 0.1 240)'), { name: 'variant-color-control', address: ".VariantControl", states: { hover: hoverColor } })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([[['.VariantControl'], 'color', content]])
  const element = button('VariantControl')
  expectColor(getComputedStyle(element).color, 'oklch(0.3 0.1 240)')
  await userEvent.hover(element)
  expect(element.matches(':hover')).toBe(true)
  expectColor(getComputedStyle(element).color, 'oklch(0.26 0.1 240)')
  await userEvent.unhover(element)
})

test('背景、内容与边线分别消费Variable，hover在变体新基础上只应用一次', async () => {
  const surface = variable('oklch(0.6 0.1 240)', { name: 'variant-button-color', address: ".VariantButton", states: { hover: hoverColor }, variants: { content: contentColor, line: base => oklch(base, { lightness: current => multiply(current, 0.75) }) } })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.VariantButton'], 'background-color', surface], [['.VariantButton'], 'color', surface.variant('content')], [['.VariantButton'], 'border-color', surface.variant('line')],
  ])
  const element = button('VariantButton')
  expectColor(getComputedStyle(element).backgroundColor, 'oklch(0.6 0.1 240)')
  expectColor(getComputedStyle(element).color, 'oklch(0.3 0.1 240)')
  expectColor(getComputedStyle(element).borderTopColor, 'oklch(0.45 0.1 240)')
  await userEvent.hover(element)
  expectColor(getComputedStyle(element).backgroundColor, 'oklch(0.56 0.1 240)')
  expectColor(getComputedStyle(element).color, 'oklch(0.26 0.1 240)')
  expectColor(getComputedStyle(element).borderTopColor, 'oklch(0.41 0.1 240)')
  await userEvent.unhover(element)
})

test.each(['普通Variable正控制', '变体'])('%s：共享引用响应根输入，局部同名输入不重新绑定祖先公式', mode => {
  const shared = variable('oklch(0.6 0.1 240)', 'variant-global-color')
  const parent = variable(shared, { name: 'variant-shared-surface', variants: { content: contentColor } })
  const content = mode === '普通Variable正控制' ? variable(contentColor(shared), 'variant-shared-control') : parent.variant('content')
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([[['.VariantShared'], 'color', content], [['.VariantLocal'], content, 'oklch(0.8 0.1 80)']])
  const first = button('VariantShared VariantLocal')
  const second = button('VariantShared VariantSecond')
  expectColor(getComputedStyle(first).color, 'oklch(0.8 0.1 80)')
  expectColor(getComputedStyle(second).color, 'oklch(0.3 0.1 240)')
  style.textContent = compileRules([[['.VariantShared'], 'color', content], [['.VariantLocal'], content, 'oklch(0.8 0.1 80)'], [[':root'], shared, 'oklch(0.8 0.1 240)']])
  expectColor(getComputedStyle(second).color, 'oklch(0.4 0.1 240)')
  expectColor(getComputedStyle(first).color, 'oklch(0.8 0.1 80)')
  style.textContent = compileRules([[['.VariantShared'], 'color', content], [['.VariantLocal'], content, 'oklch(0.8 0.1 80)'], [[':root'], shared, 'oklch(0.8 0.1 240)'], [['.VariantSecond'], shared, 'oklch(0.4 0.1 240)']])
  expectColor(getComputedStyle(second).color, 'oklch(0.4 0.1 240)')
  expectColor(getComputedStyle(first).color, 'oklch(0.8 0.1 80)')
})
