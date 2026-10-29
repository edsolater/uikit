/** 在真实浏览器验证具名混色的通道语义与 CSS 变量更新。 */
import { expect, test } from 'vitest'
import { compileRules } from '../../css-root'
import { token } from '../../token'
import { multiply } from './calc'
import { colorMix } from './color-mix'

test('半透明基色能区分通道设值和相对变化，并持续响应局部颜色、透明度和权重', () => {
  const source = token('oklch(0.6 0.12 250 / 0.5)', 'mix-browser-source')
  const alpha = token(0.14, 'mix-browser-alpha')
  const weight = token(0.18, 'mix-browser-weight')
  const fixedMix = colorMix({ color: { base: source, alpha }, weight }, 'white')
  const relativeMix = colorMix(
    {
      color: {
        base: source,
        alpha: (current) => multiply(current, alpha),
      },
      weight,
    },
    'white',
  )
  const style = document.head.appendChild(document.createElement('style'))
  const fixed = document.body.appendChild(document.createElement('div'))
  const relative = document.body.appendChild(document.createElement('div'))
  const expected = document.body.appendChild(document.createElement('div'))
  fixed.className = 'fixed-mix'
  relative.className = 'relative-mix'
  try {
    style.textContent = compileRules([
      [['.fixed-mix'], 'background-color', fixedMix],
      [['.relative-mix'], 'background-color', relativeMix],
    ])
    const expectedColor = (
      alpha: number,
      weight = 0.18,
      base = '0.6 0.12 250',
    ) => {
      expected.style.backgroundColor = `color-mix(in oklab, oklch(${base} / ${alpha}) ${weight * 100}%, white)`
      return getComputedStyle(expected).backgroundColor
    }
    expect(getComputedStyle(fixed).backgroundColor).toBe(expectedColor(0.14))
    expect(getComputedStyle(relative).backgroundColor).toBe(expectedColor(0.07))
    expect(getComputedStyle(fixed).backgroundColor).not.toBe(
      getComputedStyle(relative).backgroundColor,
    )

    fixed.style.setProperty('--mix-browser-alpha', '0.4')
    expect(getComputedStyle(fixed).backgroundColor).toBe(expectedColor(0.4))
    relative.style.setProperty(
      '--mix-browser-source',
      'oklch(0.5 0.1 30 / 0.8)',
    )
    expect(getComputedStyle(relative).backgroundColor).toBe(
      expectedColor(0.112, 0.18, '0.5 0.1 30'),
    )
    fixed.style.setProperty('--mix-browser-weight', '0')
    expect(getComputedStyle(fixed).backgroundColor).toBe(expectedColor(0.4, 0))
  } finally {
    fixed.remove()
    relative.remove()
    expected.remove()
    style.remove()
  }
})
