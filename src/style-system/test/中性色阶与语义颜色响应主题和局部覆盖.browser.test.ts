/** 验证中性色阶与语义颜色在真实主题和局部覆盖中的表现。 */
import '../../css/all-base.css'
import { afterEach, expect, test } from 'vitest'
import { color, compileCSS, rule, rules, type RulesHandle } from '../index'
import { brandColor } from '../pieces/contents/atoms/color/brand'
import { neutralColor } from '../pieces/contents/atoms/color/neutral'
import { surfaceColor } from '../pieces/contents/atoms/color/surface'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('data-theme')
})

/** 一次编译后保持同一份样式，用于检查主题是否由原生变量继续响应。 */
function mountStyles() {
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  return style
}

test('完整九级中性色消费基础 CSS，切换主题不需重编译', () => {
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
  const swatches = levels.map((level) => {
    handles.push(rule(`.swatch-${level}`, 'background-color', neutralColor(level)))
    const swatch = document.body.appendChild(document.createElement('div'))
    swatch.className = `swatch-${level}`
    return swatch
  })
  const style = mountStyles()
  const originalCSS = style.textContent
  const light = swatches.map(swatch => getComputedStyle(swatch).backgroundColor)
  const reference = document.body.appendChild(document.createElement('div'))

  for (const theme of ['light', 'dark']) {
    document.documentElement.dataset.theme = theme
    const colors = swatches.map((swatch, level) => {
      reference.style.backgroundColor = `var(--dye-neutral-${level})`
      const actual = getComputedStyle(swatch).backgroundColor
      expect(actual).toBe(getComputedStyle(reference).backgroundColor)
      expect(actual).not.toBe('rgba(0, 0, 0, 0)')
      if (theme === 'dark') expect(actual).not.toBe(light[level])
      return actual
    })
    expect(new Set(colors).size).toBe(9)
  }
  expect(style.textContent).toBe(originalCSS)
})

test('Cluster 成员用于 Mixin 与局部赋值，覆盖只影响本地及其后代', () => {
  const background = neutralColor(1)
  const foreground = neutralColor(7)
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

  for (const theme of ['light', 'dark']) {
    document.documentElement.dataset.theme = theme
    for (const element of [local, child]) {
      expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)')
      expect(getComputedStyle(element).color).toBe('rgb(4, 5, 6)')
    }
    expect(getComputedStyle(neighbor).backgroundColor).not.toBe('rgb(1, 2, 3)')
    expect(getComputedStyle(neighbor).color).not.toBe('rgb(4, 5, 6)')
  }
})

test('语义颜色 Atom 保留品牌与承载面的基础 token 和局部覆盖入口', () => {
  handles.push(rules('.semantic', [color({ foreground: brandColor, background: surfaceColor })]))
  const style = mountStyles()
  expect(style.textContent).not.toContain(':root')
  const sample = document.body.appendChild(document.createElement('div'))
  sample.className = 'semantic'
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'var(--color-brand)'
  reference.style.backgroundColor = 'var(--color-surface)'

  for (const theme of ['light', 'dark']) {
    document.documentElement.dataset.theme = theme
    expect(getComputedStyle(sample).color).toBe(getComputedStyle(reference).color)
    expect(getComputedStyle(sample).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
    expect(getComputedStyle(sample).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  }
  sample.style.setProperty('--color-brand', 'rgb(10, 20, 30)')
  sample.style.setProperty('--color-surface', 'rgb(40, 50, 60)')
  expect(getComputedStyle(sample).color).toBe('rgb(10, 20, 30)')
  expect(getComputedStyle(sample).backgroundColor).toBe('rgb(40, 50, 60)')
})
