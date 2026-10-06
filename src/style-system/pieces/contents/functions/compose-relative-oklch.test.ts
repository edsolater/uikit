/** 验证相对颜色保留来源与指定通道的不同输出语义。 */
import { expect, test } from 'vitest'
import { condition } from '../../../condition'
import { compileRules } from '../../../css-root'
import { deriveColor } from './compose-relative-oklch'

test('只改变明度时保留来源透明度，显式透明度 1 则覆盖来源', () => {
  const source = 'oklch(0.6 0.12 250 / 0.4)'
  const css = compileRules([
    [[condition('.Follow')], 'color', deriveColor(source, { adjustments: { lightness: -0.04 } })],
    [[condition('.Opaque')], 'color', deriveColor(source, { channels: { alpha: 1 } })],
  ])
  expect(css).toContain(`color: oklch(from ${source} calc(l + -0.04) c h);`)
  expect(css).toContain(`color: oklch(from ${source} l c h / 1);`)
})
