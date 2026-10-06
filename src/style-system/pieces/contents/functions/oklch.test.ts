/** 验证普通 OKLCH 具名通道及其 JSS 依赖消费。 */
import { expect, test } from 'vitest'
import { oklch, variable, condition } from '../../..'
import { compileRules } from '../../../css-root'

test.each([undefined, 1, 0, 0.8])('普通颜色正确输出透明度 %s', (alpha) => {
  const css = compileRules([[[condition('.Swatch')], 'color', oklch({ lightness: 0.6, chroma: 0.12, hue: 250, alpha })]])
  const opacity = alpha === undefined || alpha === 1 ? '' : ` / ${alpha}`
  expect(css).toContain(`color: oklch(0.6 0.12 250${opacity});`)
  expect(css).not.toContain('oklch(from ')
})

test('通道 Variable 在编译时解析并保留其 CSS 引用', () => {
  const lightness = variable(0.6, 'swatch-lightness')
  const css = compileRules([[[condition('.Swatch')], 'color', oklch({ lightness, chroma: 0.12, hue: 250 })]])
  expect(css).toContain('color: oklch(var(--swatch-lightness, 0.6) 0.12 250);')
})
