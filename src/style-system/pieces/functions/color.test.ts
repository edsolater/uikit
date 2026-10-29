/** 验证独立颜色入口的身份、延迟描述和声明消费。 */
import { expect, test } from 'vitest'
import { compileCSS, compileRules } from '../../css-root'
import { rules } from '../../rule'
import { isToken, token } from '../../token'
import { paint } from '../mixins/appearance'
import { multiply } from './calc'
import { color } from './color'

test('颜色统一返回 Token，已有 Token 复用身份，未提供颜色不产生声明', () => {
  const source = Object.assign(token('red'), { base: 'blue' })
  expect(color(source)).toBe(source)
  expect(color(source, undefined)).toBe(source)
  expect(isToken(color('red'))).toBe(true)
  expect(isToken(color(undefined))).toBe(true)
  expect(compileRules([[['.Value'], 'color', color('red')]])).toContain(
    'color: red;',
  )
  const before = compileCSS()
  const handle = rules('.Empty', paint())
  try {
    expect(compileCSS()).toBe(before)
  } finally {
    handle.remove()
  }
})

test('名称与 Token 配置在最终颜色定义中生效', () => {
  const direct = color('red', 'direct-color')
  const named = color({ base: 'blue', alpha: 0.2 }, 'named-color')
  const configured = color(
    { base: 'red', alpha: 0.3 },
    {
      name: 'configured-color',
      address: '.Configured',
      state: { hover: 'blue' },
      registration: { syntax: '<color>', inherits: true, initialValue: 'red' },
      onFirstScan: () => [[['.ColorResource'], '--color-ready', 'ready']],
    },
  )
  const css = compileRules([
    [['.Consumer'], 'color', configured],
    [['.Consumer'], 'background-color', direct],
    [['.Consumer'], 'border-color', named],
  ])
  expect(css).toContain('@property --configured-color')
  expect(css).toContain('.Configured {')
  expect(css).toContain('--configured-color: oklch(from red l c h / 0.3);')
  expect(css).toMatch(/:hover[^}]+--configured-color: blue;/s)
  expect(css).toContain('--color-ready: ready;')
  expect(css).toContain('--direct-color: red;')
  expect(css).toContain('--named-color: oklch(from blue l c h / 0.2);')
})

test('已有颜色带配置时沿用 Token 继承及异型默认内容替换', () => {
  const source = color('red', {
    name: 'source-color',
    address: '.Inherited',
    state: { hover: 'blue' },
  })
  const inherited = color(source, { name: 'next', state: { active: 'green' } })
  const replaced = color(source, { name: 'replaced', default: 0.5 })
  const css = compileRules([
    [['.Consumer'], 'color', inherited],
    [['.Consumer'], 'opacity', replaced],
  ])
  expect(inherited.default).toBe(source)
  expect(replaced.default).toBe(0.5)
  expect(css).toContain(`--${inherited.name}: var(--${source.name});`)
  expect(css).toContain('.Inherited {')
  expect(css).toMatch(new RegExp(`:hover[^}]+--${inherited.name}: blue;`, 's'))
  expect(css).toMatch(
    new RegExp(`:active[^}]+--${inherited.name}: green;`, 's'),
  )
  expect(css).toContain(`--${replaced.name}: 0.5;`)
})

test('用户依赖和输出协议覆盖颜色默认协议', () => {
  const dependency = token('green', 'color-option-dependency')
  const configured = color(
    {
      base: () => {
        throw new Error('已覆盖的默认依赖不应消费')
      },
    },
    {
      dependencies: () => [dependency],
      toCSSString: (_current, resolve) => resolve(dependency),
    },
  )
  const css = compileRules([[['.CustomColor'], 'color', configured]])
  expect(css).toContain('--color-option-dependency: green;')
  expect(css).toContain('color: var(--color-option-dependency);')
})

test('颜色描述独立使用，消费时读取最新来源及替换后的通道', () => {
  const description = { base: 'red', alpha: 0.14 }
  const result = color(description)
  description.base = 'blue'
  expect(compileRules([[['.First'], 'border-color', result]])).toContain(
    'border-color: oklch(from blue l c h / 0.14);',
  )
  const source = token('green', 'independent-source')
  result.default = { base: source, alpha: (current) => multiply(current, 0.4) }
  const css = compileRules([[['.Next'], 'border-color', result]])
  expect(css).toContain('--independent-source: green;')
  expect(css).toContain(
    'border-color: oklch(from var(--independent-source) l c h / calc(alpha * 0.4));',
  )
  expect(css).not.toContain('from blue')
})

test('着色声明直接消费颜色描述和已有颜色 Token，未指定通道保留来源', () => {
  const source = token('red', 'paint-source')
  const background = color({ base: source, alpha: 0.2 })
  const handle = rules(
    '.Painted',
    paint({
      content: { base: source, chroma: 0.08 },
      background,
    }),
  )
  try {
    const css = compileCSS()
    expect(css).toContain(
      'color: oklch(from var(--paint-source) l 0.08 h / alpha);',
    )
    expect(css).toContain(
      'background-color: oklch(from var(--paint-source) l c h / 0.2);',
    )
  } finally {
    handle.remove()
  }
})
