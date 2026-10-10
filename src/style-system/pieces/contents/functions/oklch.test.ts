/** 验证普通与相对 OKLCH 通道、依赖消费和缺失内容边界。 */
import { expect, test } from 'vitest'
import { oklch } from './oklch'
import { variable } from '../../../variable'
import { condition } from '../../../condition'
import { compileRules } from '../../../css-root'
import { add } from './calc'
import { value } from '../../../value'

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

test('替换普通颜色内容后沿用格式并解析新通道依赖', () => {
  const original = oklch({ lightness: 0.6, chroma: 0.12, hue: 250 })
  const lightness = variable(0.4, 'replacement-lightness')
  const next = original.withContent({ lightness, chroma: 0.08, hue: 30, alpha: 0 })
  const css = compileRules([[[condition('.Replaced')], 'color', next]])
  expect(css).toContain('color: oklch(var(--replacement-lightness, 0.4) 0.08 30 / 0);')
})

test.each([
  [{}, 'l c h / alpha'],
  [{ lightness: 0.4 }, '0.4 c h / alpha'],
  [{ chroma: 0.08 }, 'l 0.08 h / alpha'],
  [{ hue: 30 }, 'l c 30 / alpha'],
  [{ alpha: 0 }, 'l c h / 0'],
])('相对颜色仅替换指定通道 %j', (changes, channels) => {
  const css = compileRules([[[condition('.Relative')], 'color', oklch('red', changes)]])
  expect(css).toContain(`color: oklch(from red ${channels});`)
})

test('通道回调在编译消费时取得当前表达式，并保留内容对象的依赖身份', () => {
  let consumed = false
  const chroma = Object.assign(() => { throw new Error('内容对象不应作为回调执行') }, { toCSSString: () => '0.08' })
  const expression = oklch('red', {
    lightness: current => { consumed = true; return add(current, -0.04) },
    chroma,
  })
  expect(consumed).toBe(false)
  const css = compileRules([[[condition('.Relative')], 'color', expression]])
  expect(css).toContain('color: oklch(from red calc(l + -0.04) 0.08 h / alpha);')
})

test('完整通道内容保留输出，来源或通道缺失时不产生颜色', () => {
  const css = compileRules([
    [[condition('.Relative')], 'color', oklch('red', 'calc(l + 0.1) c h / alpha')],
    [[condition('.MissingChannels')], 'color', oklch('red', undefined)],
    [[condition('.MissingSource')], 'color', oklch(undefined, {})],
    [[condition('.MissingChannel')], 'color', oklch('red', { lightness: value(undefined) })],
  ])
  expect(css).toContain('color: oklch(from red calc(l + 0.1) c h / alpha);')
  expect(css).not.toContain('.Missing')
})
