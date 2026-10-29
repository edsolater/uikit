/** 在真实浏览器验证独立颜色值与着色声明共享同一颜色描述。 */
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileCSS } from '../../css-root'
import { rules } from '../../rule'
import { token } from '../../token'
import { paint } from '../mixins/appearance'
import { multiply } from './calc'
import { color } from './color'

test('独立边界颜色与声明内颜色分别支持回调和设值，并响应局部来源与配置状态', async () => {
  const source = token('oklch(0.6 0.12 250 / 0.5)', 'color-browser-source')
  const factor = token(0.14, 'color-browser-factor')
  const boundary = color(
    {
      base: source,
      alpha: (current) => multiply(current, factor),
    },
    { name: 'browser-boundary-color', state: { hover: 'green' } },
  )
  const style = document.head.appendChild(document.createElement('style'))
  const swatch = document.body.appendChild(document.createElement('div'))
  swatch.className = 'independent-color'
  swatch.textContent = '颜色配置验证'
  const handle = rules('.independent-color', [
    { 'border-color': boundary },
    paint({ content: { base: source, alpha: 0.14 } }),
  ])
  try {
    style.textContent = compileCSS()
    expect(getComputedStyle(swatch).borderTopColor).toBe(
      'oklch(0.6 0.12 250 / 0.07)',
    )
    expect(getComputedStyle(swatch).color).toBe('oklch(0.6 0.12 250 / 0.14)')
    expect(getComputedStyle(swatch).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    swatch.style.setProperty(
      '--color-browser-source',
      'oklch(0.5 0.1 30 / 0.8)',
    )
    swatch.style.setProperty('--color-browser-factor', '0.5')
    expect(getComputedStyle(swatch).borderTopColor).toBe(
      'oklch(0.5 0.1 30 / 0.4)',
    )
    expect(getComputedStyle(swatch).color).toBe('oklch(0.5 0.1 30 / 0.14)')
    await userEvent.hover(swatch)
    expect(getComputedStyle(swatch).borderTopColor).toBe('rgb(0, 128, 0)')
  } finally {
    handle.remove()
    swatch.remove()
    style.remove()
  }
})
