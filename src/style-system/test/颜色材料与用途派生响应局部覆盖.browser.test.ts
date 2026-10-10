/** 验证 JS 颜色材料独立供色，以及基础 Variable 覆盖沿用途规则传播。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { color } from '../pieces/mixins/appearance'
import { compileCSS } from '../css-root'
import { rule, rules, type RulesHandle } from '../rule'
import { brandColor, canvasColor, neutralColor, paperColor, inkColor, surfaceColor, foregroundColor, surfaceColorInteractive, foregroundColorInteractive, lineColor } from '../pieces/contents/atoms/color/colors'
import { interactiveColor, highlightColor } from '../pieces/contents/atoms/color/ui-action-colors'
import { goodColors, badColors, warnColors, infoColors } from '../pieces/contents/atoms/color/ui-info-color'
import { paper, ink, neutral } from '../pieces/contents/atoms/color/palette'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
  document.body.style.removeProperty('color')
})

/** 将本轮 JS 定义直接编译并挂载，不加载静态颜色 CSS。 */
function mountStyles() {
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  expect(style.textContent).not.toMatch(/var\(--(?:color-|dye-|base-)/)
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
  const foreground = inkColor
  handles.push(rules('.sample', [color({ background, foreground })]))
  handles.push(rule('.local', background, 'rgb(1, 2, 3)'))
  handles.push(rule('.local', foreground, 'rgb(4, 5, 6)'))
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

test('纸色与品牌变量局部修改后，用途色和品牌变化自动更新而不重编译', () => {
  handles.push(rules('.semantic', [color({ foreground: interactiveColor, background: surfaceColor })]))
  handles.push(rule('.highlight', 'color', highlightColor))
  handles.push(rule('.canvas', 'background-color', canvasColor))
  handles.push(rule('.text', 'color', foregroundColor))
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
  const before = { surface: getComputedStyle(sample).backgroundColor, highlight: getComputedStyle(highlight).color }
  expect(getComputedStyle(sample).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  sample.style.setProperty(`--${brandColor.name}`, 'rgb(10, 20, 30)')
  sample.style.setProperty(`--${paperColor.name}`, 'rgb(240, 241, 242)')
  expect(getComputedStyle(sample).color).toBe('rgb(10, 20, 30)')
  expect(getComputedStyle(highlight).color).not.toBe(before.highlight)
  expect(getComputedStyle(sample).backgroundColor).not.toBe(before.surface)
  expectSameColor(getComputedStyle(canvas).backgroundColor, 'rgb(240, 241, 242)')
  expect(getComputedStyle(text).color).not.toBe('rgba(0, 0, 0, 0)')
  expect(getComputedStyle(neighbor).color).not.toBe('rgb(10, 20, 30)')
  expect(style.textContent).toBe(originalCSS)
})

test('交互状态的品牌变化仍引用局部品牌变量', async () => {
  handles.push(rule('.interactive-swatch', 'color', interactiveColor))
  const style = mountStyles()
  const originalCSS = style.textContent
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'interactive-swatch'
  button.textContent = '交互颜色'
  button.style.setProperty(`--${brandColor.name}`, 'oklch(0.6 0.15 140)')
  await userEvent.hover(button)
  const firstHover = getComputedStyle(button).color
  button.style.setProperty(`--${brandColor.name}`, 'oklch(0.6 0.15 30 / 0.4)')
  expect(getComputedStyle(button).color).not.toBe(firstHover)
  expectSameColor(getComputedStyle(button).color, 'oklch(0.56 0.16 30 / 0.4)')
  button.focus()
  await userEvent.keyboard('[Space>]')
  try {
    expect(button.matches(':active')).toBe(true)
    const firstActive = getComputedStyle(button).color
    button.style.setProperty(`--${brandColor.name}`, 'oklch(0.6 0.15 280)')
    expect(getComputedStyle(button).color).not.toBe(firstActive)
    expectSameColor(getComputedStyle(button).color, 'oklch(0.52 0.14 280)')
  } finally { await userEvent.keyboard('[/Space]') }
  expect(style.textContent).toBe(originalCSS)
})

test('交互用途色的状态派生保留局部纸色与墨色覆盖', async () => {
  handles.push(rules('.interactive-purpose', [color({ background: surfaceColorInteractive, foreground: foregroundColorInteractive })]))
  const style = mountStyles()
  const originalCSS = style.textContent
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'interactive-purpose'
  button.textContent = '用途颜色'
  button.style.setProperty(`--${paperColor.name}`, 'oklch(0.8 0.02 140)')
  button.style.setProperty(`--${inkColor.name}`, 'rgb(78, 90, 123)')
  await userEvent.hover(button)
  expectSameColor(getComputedStyle(button).backgroundColor, 'oklch(0.76 0.02 140)')
  expectSameColor(getComputedStyle(button).color, 'rgb(78, 90, 123)')
  button.style.setProperty(`--${paperColor.name}`, 'oklch(0.6 0.02 30)')
  button.style.setProperty(`--${inkColor.name}`, 'rgb(123, 90, 78)')
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

test('状态基色及其前景与分隔用途在没有静态颜色 CSS 时有效渲染', () => {
  const statuses = [goodColors, badColors, warnColors, infoColors]
  const samples = statuses.map((status, index) => {
    handles.push(rules(`.status-${index}`, [color({ background: status('default'), foreground: status('foreground') })]))
    const sample = document.body.appendChild(document.createElement('div'))
    sample.className = `status-${index}`
    sample.textContent = '状态信息'
    return sample
  })
  handles.push(rule('.separator', 'background-color', lineColor))
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
    samples[index].style.setProperty(`--${statuses[index].name}`, 'white')
    const brightForeground = getComputedStyle(samples[index]).color
    samples[index].style.setProperty(`--${statuses[index].name}`, 'black')
    expect(getComputedStyle(samples[index]).color).not.toBe(brightForeground)
  }
})
