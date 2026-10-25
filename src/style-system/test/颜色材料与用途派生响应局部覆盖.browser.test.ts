/** 验证 JS 颜色材料独立供色，以及基础 Variable 覆盖沿用途规则传播。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { color } from '../pieces/mixins/appearance'
import { compileCSS } from '../css-root'
import { rule, rules, type RulesHandle } from '../rule'
import { lineColor, lineStrength } from '../pieces/contents/atoms/color/colors'
import { brandColor } from '../pieces/contents/atoms/color/brand-color'
import { interactiveColor, highlightColor } from '../pieces/contents/atoms/color/ui-action-colors'
import { goodColor, badColor, warnColor, infoColor } from '../pieces/contents/atoms/color/ui-info-color'
import { paper, ink, neutral, paperColor, inkColor, neutralColor } from '../pieces/contents/atoms/color/palette'
import { interactiveColorStates } from '../pieces/contents/atoms/color/ui-variable-structure'
import { variable, variableFrom } from '../variable'
import { declare } from '../operations/declare'
import { readableContent } from '../pieces/contents/atoms/color/ui-color-structure'
import { colorMix } from '../pieces/contents/functions/color-mix'

const surfaceColorInteractive = variable(interactiveColorStates({ base: paperColor }), { name: 'purpose-surface', address: '.interactive-purpose' })
const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
  document.body.style.removeProperty('color')
  for (const source of [brandColor, paperColor]) document.documentElement.style.removeProperty(source.toCSSString())
})

/** 将本轮 JS 定义直接编译并挂载，不加载静态颜色 CSS。 */
function mountStyles() {
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  return style
}

/** 让浏览器把独立颜色表达式规范化到同一输出格式。 */
function normalizeColor(expression: string, property = 'color') {
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.setProperty(property, expression)
  const result = getComputedStyle(reference).getPropertyValue(property)
  reference.remove()
  return result
}

/** 比较浏览器归一到 sRGB 的数值，避免不同色空间字符串掩盖错误。 */
function expectSameColor(actual: string, expected: string) {
  const channels = (expression: string) => normalizeColor(`color(from ${expression} srgb r g b / alpha)`)
    .match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)!.map(Number)
  const left = channels(actual)
  const right = channels(expected)
  expect(left).toHaveLength(right.length)
  left.forEach((amount, index) => expect(amount).toBeCloseTo(right[index], 4))
}

test.each([
  { lightnessResponse: 0, chromaResponse: 0 },
  { lightnessResponse: 0, chromaResponse: 1 },
  { lightnessResponse: 2, chromaResponse: 0.5 },
])('交互颜色模板按明度 $lightnessResponse、彩度 $chromaResponse 倍率响应当前来源', async ({ lightnessResponse, chromaResponse }) => {
  const source = variable('oklch(0.6 0.15 140 / 0.4)', 'response-source')
  const color = variable(interactiveColorStates({ base: source, lightnessResponse, chromaResponse }), { name: 'response-color', address: '.response-swatch' })
  handles.push(rule('.response-swatch', 'color', color))
  const style = mountStyles()
  const originalCSS = style.textContent
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'response-swatch'
  button.textContent = '响应倍率'
  expectSameColor(getComputedStyle(button).color, 'oklch(0.6 0.15 140 / 0.4)')
  await userEvent.hover(button)
  expectSameColor(getComputedStyle(button).color, `oklch(${0.6 - 0.04 * lightnessResponse} ${0.15 + 0.01 * chromaResponse} 140 / 0.4)`)
  button.style.setProperty(source.key.toCSSString(), 'oklch(0.8 0.2 30 / 0.6)')
  expectSameColor(getComputedStyle(button).color, `oklch(${0.8 - 0.04 * lightnessResponse} ${0.2 + 0.01 * chromaResponse} 30 / 0.6)`)
  button.focus()
  await userEvent.keyboard('[Space>]')
  try {
    expect(button.matches(':active')).toBe(true)
    expectSameColor(getComputedStyle(button).color, `oklch(${0.8 - 0.08 * lightnessResponse} ${0.2 - 0.01 * chromaResponse} 30 / 0.6)`)
  } finally { await userEvent.keyboard('[/Space]') }
  expect(style.textContent).toBe(originalCSS)
})

test('不加载 color.css 也能渲染纸色、墨色和中性材料', () => {
  const sources = [paperColor, inkColor, neutralColor]
  const materials = [paper, ink, neutral]
  const swatches = sources.map((source, index) => {
    handles.push(rule(`.swatch-${index}`, 'background-color', source))
    const swatch = document.body.appendChild(document.createElement('div'))
    swatch.className = `swatch-${index}`
    return swatch
  })
  mountStyles()
  const colors = swatches.map(swatch => getComputedStyle(swatch).backgroundColor)
  expect(new Set(colors).size).toBe(3)
  colors.forEach((actual, index) => {
    const { lightness, chroma, hue } = materials[index].base
    expectSameColor(actual, `oklch(${lightness} ${chroma} ${hue})`)
  })
})

test('材料变量用于 Mixin 与局部赋值，覆盖只影响本地及其后代', () => {
  const background = paperColor
  const content = inkColor
  handles.push(rules('.sample', [color({ background, content })]))
  handles.push(rule('.local', background, 'rgb(1, 2, 3)'))
  handles.push(rule('.local', content, 'rgb(4, 5, 6)'))
  mountStyles()
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'sample local'
  const child = local.appendChild(document.createElement('div'))
  child.className = 'sample'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'sample'
  for (const element of [local, child]) {
    expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)')
    expect(getComputedStyle(element).color).toBe('rgb(4, 5, 6)')
  }
  expect(getComputedStyle(neighbor).backgroundColor).not.toBe('rgb(1, 2, 3)')
  expect(getComputedStyle(neighbor).color).not.toBe('rgb(4, 5, 6)')
})

test('根上的纸色与品牌改变后，既有用途色共同更新而不重编译', () => {
  const action = variableFrom(interactiveColor, interactiveColor.content, { address: '.semantic' })
  handles.push(rules('.semantic', [color({ content: action, background: paperColor })]))
  handles.push(rule('.highlight', 'color', highlightColor))
  handles.push(rule('.canvas', 'background-color', paperColor))
  handles.push(rule('.text', 'color', inkColor))
  const style = mountStyles()
  const originalCSS = style.textContent
  const sample = document.body.appendChild(document.createElement('div'))
  sample.className = 'semantic'
  const highlight = sample.appendChild(document.createElement('div'))
  highlight.className = 'highlight'
  const canvas = sample.appendChild(document.createElement('div'))
  canvas.className = 'canvas'
  const text = sample.appendChild(document.createElement('div'))
  text.className = 'text'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'semantic'
  const before = { surface: getComputedStyle(sample).backgroundColor }
  expect(getComputedStyle(sample).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  document.documentElement.style.setProperty(brandColor.key.toCSSString(), 'oklch(0.6 0.15 140 / 0.4)')
  document.documentElement.style.setProperty(paperColor.key.toCSSString(), 'rgb(240, 241, 242)')
  expectSameColor(getComputedStyle(sample).color, 'oklch(0.6 0.15 140 / 0.4)')
  expectSameColor(getComputedStyle(highlight).color, 'oklch(0.64 0.16 122 / 0.4)')
  expect(getComputedStyle(sample).backgroundColor).not.toBe(before.surface)
  expectSameColor(getComputedStyle(canvas).backgroundColor, 'rgb(240, 241, 242)')
  expect(getComputedStyle(text).color).not.toBe('rgba(0, 0, 0, 0)')
  expect(getComputedStyle(neighbor).color).toBe(getComputedStyle(sample).color)
  expect(style.textContent).toBe(originalCSS)
})

test('交互状态的品牌变化仍引用局部品牌变量', async () => {
  const localColor = variableFrom(interactiveColor, interactiveColor.content, { address: '.interactive-swatch' })
  handles.push(rule('.interactive-swatch', 'color', localColor))
  const style = mountStyles()
  const originalCSS = style.textContent
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'interactive-swatch'
  button.textContent = '交互颜色'
  button.style.setProperty(brandColor.key.toCSSString(), 'oklch(0.6 0.15 140)')
  await userEvent.hover(button)
  const firstHover = getComputedStyle(button).color
  button.style.setProperty(brandColor.key.toCSSString(), 'oklch(0.6 0.15 30 / 0.4)')
  expect(getComputedStyle(button).color).not.toBe(firstHover)
  expectSameColor(getComputedStyle(button).color, 'oklch(0.56 0.16 30 / 0.4)')
  button.focus()
  await userEvent.keyboard('[Space>]')
  try {
    expect(button.matches(':active')).toBe(true)
    const firstActive = getComputedStyle(button).color
    button.style.setProperty(brandColor.key.toCSSString(), 'oklch(0.6 0.15 280)')
    expect(getComputedStyle(button).color).not.toBe(firstActive)
    expectSameColor(getComputedStyle(button).color, 'oklch(0.52 0.14 280)')
  } finally { await userEvent.keyboard('[/Space]') }
  expect(style.textContent).toBe(originalCSS)
})

test('交互用途色的状态派生保留局部纸色与墨色覆盖', async () => {
  handles.push(rules('.interactive-purpose', [color({ background: surfaceColorInteractive, content: inkColor })]))
  const style = mountStyles()
  const originalCSS = style.textContent
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'interactive-purpose'
  button.textContent = '用途颜色'
  button.style.setProperty(paperColor.key.toCSSString(), 'oklch(0.8 0.02 140)')
  button.style.setProperty(inkColor.key.toCSSString(), 'rgb(78, 90, 123)')
  await userEvent.hover(button)
  expectSameColor(getComputedStyle(button).backgroundColor, 'oklch(0.76 0.02 140)')
  expectSameColor(getComputedStyle(button).color, 'rgb(78, 90, 123)')
  button.style.setProperty(paperColor.key.toCSSString(), 'oklch(0.6 0.02 30)')
  button.style.setProperty(inkColor.key.toCSSString(), 'rgb(123, 90, 78)')
  expectSameColor(getComputedStyle(button).backgroundColor, 'oklch(0.56 0.02 30)')
  expectSameColor(getComputedStyle(button).color, 'rgb(123, 90, 78)')
  button.focus()
  await userEvent.keyboard('[Space>]')
  try {
    expect(button.matches(':active')).toBe(true)
    expectSameColor(getComputedStyle(button).backgroundColor, 'oklch(0.52 0.02 30)')
  } finally { await userEvent.keyboard('[/Space]') }
  expect(style.textContent).toBe(originalCSS)
})

test('状态基色及其内容色与分隔用途在没有静态颜色 CSS 时有效渲染', () => {
  const statuses = [goodColor, badColor, warnColor, infoColor]
  const samples = statuses.map((status, index) => {
    handles.push(rules(`.status-${index}`, [color({ background: status, content: index === 1 ? paperColor : readableContent(status) })]))
    const sample = document.body.appendChild(document.createElement('div'))
    sample.className = `status-${index}`
    sample.textContent = '状态信息'
    return sample
  })
  handles.push(rule('.separator', 'background-color', lineColor(inkColor)))
  const separator = document.body.appendChild(document.createElement('div'))
  separator.className = 'separator'
  document.body.style.color = 'magenta'
  mountStyles()
  expect(new Set(samples.map(sample => getComputedStyle(sample).backgroundColor)).size).toBe(4)
  for (const sample of samples) {
    expect(getComputedStyle(sample).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(getComputedStyle(sample).color).not.toBe('rgb(255, 0, 255)')
  }
  expect(getComputedStyle(separator).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  for (const index of [0, 2, 3]) {
    samples[index].style.setProperty(statuses[index].key.toCSSString(), 'white')
    const brightContent = getComputedStyle(samples[index]).color
    samples[index].style.setProperty(statuses[index].key.toCSSString(), 'black')
    expect(getComputedStyle(samples[index]).color).not.toBe(brightContent)
  }
})

test('转换函数的两个基础分别响应当地表面与全局及局部线条强度', () => {
  const first = variable('red', {
    name: 'line-first-surface', address: '.FirstLine', priority: 4,
    registration: { syntax: '<color>', inherits: true, initialValue: 'blue' },
  })
  const second = variable('blue', { name: 'line-second-surface', address: '.SecondLine' })
  const firstLine = lineColor(first)
  const secondLine = lineColor(second)

  handles.push(rule('.FirstLine', 'color', firstLine))
  handles.push(rule('.SecondLine', 'color', secondLine))
  handles.push(rules('.LocalLine', [declare(first, 'lime'), declare(lineStrength, 0.5)]))
  const style = mountStyles()
  const originalCSS = style.textContent
  const scope = document.body.appendChild(document.createElement('section'))
  scope.className = 'LineScope'
  const normal = scope.appendChild(document.createElement('div'))
  normal.className = 'FirstLine'
  const other = scope.appendChild(document.createElement('div'))
  other.className = 'SecondLine'
  const local = scope.appendChild(document.createElement('div'))
  local.className = 'FirstLine LocalLine'
  expectSameColor(getComputedStyle(normal).color, 'color-mix(in oklab, red 18%, transparent)')
  expectSameColor(getComputedStyle(other).color, 'color-mix(in oklab, blue 18%, transparent)')
  expectSameColor(getComputedStyle(local).color, 'color-mix(in oklab, lime 50%, transparent)')
  scope.style.setProperty(lineStrength.toCSSString(), '0.4')
  expectSameColor(getComputedStyle(normal).color, 'color-mix(in oklab, red 40%, transparent)')
  expectSameColor(getComputedStyle(other).color, 'color-mix(in oklab, blue 40%, transparent)')
  expectSameColor(getComputedStyle(local).color, 'color-mix(in oklab, lime 50%, transparent)')
  local.style.setProperty(first.toCSSString(), 'yellow')
  expectSameColor(getComputedStyle(local).color, 'color-mix(in oklab, yellow 50%, transparent)')
  expectSameColor(getComputedStyle(normal).color, 'color-mix(in oklab, red 40%, transparent)')
  expect(style.textContent).toBe(originalCSS)
  const competitor = variable('black', { name: firstLine.name, priority: 3 })
  handles.push(rules('.FirstLine', [declare(firstLine, 'red'), declare(competitor, 'black')]))
  style.textContent = compileCSS()
  expectSameColor(getComputedStyle(normal).color, 'red')
  const tied = variable('gold', { name: firstLine.name, priority: 4 })
  handles.push(rule('.FirstLine', tied, 'gold'))
  style.textContent = compileCSS()
  expectSameColor(getComputedStyle(normal).color, 'gold')
  normal.style.setProperty(firstLine.toCSSString(), 'invalid-color')
  expectSameColor(getComputedStyle(normal).color, 'blue')
})

test('线条沿用基础根据地，各状态和用途的最终颜色只转换一次', () => {
  const base = variable('red', {
    name: 'line-state-surface', address: '.LineHome',
    states: { '&[data-function]': current => colorMix([current, 0.5], 'blue'), '&[data-fixed]': 'lime' },
    variants: {
      fixed: 'gold',
      mixed: current => colorMix([current, 0.5], 'white'),
      own: { default: 'orange', '&[data-function]': 'purple', '&[data-fixed]': 'black' },
    },
  })
  const line = lineColor(base)
  const outputs = [line, line.variant('fixed'), line.variant('mixed'), line.variant('own')]
  handles.push(rule(':root', base.toCSSString(), 'blue'))
  handles.push(rule('.LineHome', 'background-color', base))
  outputs.forEach((output, index) => handles.push(rule(`.LineOutput${index}`, 'color', output)))
  const style = mountStyles()
  const committed = style.textContent
  const home = document.body.appendChild(document.createElement('section'))
  home.className = 'LineHome'
  const readers = outputs.map((_, index) => {
    const reader = home.appendChild(document.createElement('div'))
    reader.className = `LineOutput${index}`
    return reader
  })
  const sibling = document.body.appendChild(document.createElement('div'))
  sibling.className = 'LineOutput0'
  const expected = [
    ['red', 'gold', 'color-mix(in oklab, red 50%, white)', 'orange'],
    ['color-mix(in oklab, red 50%, blue)', 'color-mix(in oklab, gold 50%, blue)', 'color-mix(in oklab, color-mix(in oklab, red 50%, white) 50%, blue)', 'purple'],
    ['lime', 'lime', 'lime', 'black'],
  ]
  for (const [phase, colors] of expected.entries()) {
    home.toggleAttribute('data-function', phase === 1)
    home.toggleAttribute('data-fixed', phase === 2)
    readers.forEach((reader, index) => expectSameColor(getComputedStyle(reader).color,
      `color-mix(in oklab, ${colors[index]} 18%, transparent)`))
    expectSameColor(getComputedStyle(home).backgroundColor, colors[0])
    expect(getComputedStyle(sibling).getPropertyValue(line.toCSSString()).trim()).toBe('')
  }
  expect(getComputedStyle(document.documentElement).getPropertyValue(line.toCSSString()).trim()).toBe('')
  expect(style.textContent).toBe(committed)
})
