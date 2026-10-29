/** 验证混色项的具名输入、通道调整和编译消费行为。 */
import { expect, test } from 'vitest'
import { compileRules } from '../../css-root'
import { token } from '../../token'
import { colorMix } from './color-mix'

test('直接颜色与元组保留不经编译读取字面量的能力', () => {
  expect(colorMix(['red', 0.18], 'white').toCSSString()).toBe(
    'color-mix(in oklab, red 18%, white)',
  )
})

test('具名权重保留零、省略与未解析输入的区别，内容对象不被配置字段截获', () => {
  const content = Object.assign(
    () => {
      throw new Error('内容不能作为生产函数执行')
    },
    {
      color: 'blue',
      base: 'blue',
      toCSSString: () => 'red',
    },
  )
  const css = compileRules([
    [['.Zero'], 'color', colorMix({ color: 'red', weight: 0 }, 'white')],
    [['.Implicit'], 'color', colorMix({ color: content }, 'white')],
    [
      ['.Missing'],
      'color',
      colorMix({ color: 'red', weight: token(undefined) }, 'white'),
    ],
    [
      ['.MissingBase'],
      'color',
      colorMix({ color: { base: token(undefined), alpha: 0.14 } }, 'white'),
    ],
  ])
  expect(css).toContain('color-mix(in oklab, red 0%, white)')
  expect(css).toContain('color-mix(in oklab, red, white)')
  expect(css).not.toContain('.Missing')
})

test('消费时读取描述和当前混色内容，替换后继续收集新 Token 依赖', () => {
  const description = { base: 'red', alpha: 0.2 }
  const mixed = colorMix({ color: description, weight: 0.5 }, 'white')
  description.alpha = 0.4
  const first = compileRules([[['.First'], 'color', mixed]])
  expect(first).toContain('oklch(from red l c h / 0.4) 50%')
  const source = token('blue', 'mix-source')
  const alpha = token(0.6, 'mix-alpha')
  const weight = token(0.3, 'mix-weight')
  mixed.default = [{ color: { base: source, alpha }, weight }, 'black']
  const next = compileRules([
    [['.Second'], 'color', mixed],
    [['.Third'], 'color', mixed],
  ])
  expect(next).toContain('--mix-source: blue;')
  expect(next).toContain('--mix-alpha: 0.6;')
  expect(next).toContain('--mix-weight: 0.3;')
  expect(next).toContain(
    'oklch(from var(--mix-source) l c h / var(--mix-alpha)) calc(var(--mix-weight) * 100%)',
  )
  expect(next).not.toContain('oklch(from red')
})
