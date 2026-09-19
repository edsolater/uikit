/** 验证色板 Variable Cluster 的查询身份、命名和原生变量消费。 */
import { afterEach, expect, test } from 'vitest'
import { compileCSS, rule, value, type RulesHandle } from '../../index'
import { colorMix } from '../../values/functions/color-mix'
import { paletteColor } from './palette'

const handles: RulesHandle[] = []
afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
})

test('省略等级等于第零级，重复查询返回同一个预定义 Variable', () => {
  const before = compileCSS()
  expect(paletteColor('neutral')).toBe(paletteColor('neutral', 0))
  for (let level = 0; level <= 8; level++) {
    const color = paletteColor('neutral', level)
    expect(color.kind).toBe('variable')
    expect(color.name).toBe(`dye-neutral-${level}`)
    expect(paletteColor('neutral', level)).toBe(color)
  }
  expect(compileCSS()).toBe(before)
})

test('不存在的色系或等级报错，不创建颜色、不回退到零级', () => {
  // @ts-expect-error 未定义的色系也必须在编译期拒绝。
  expect(() => paletteColor('missing')).toThrow()
  for (const level of [-1, 9, 0.5, NaN, Infinity]) {
    expect(() => paletteColor('neutral', level)).toThrow()
  }
  expect(paletteColor('neutral').name).toBe('dye-neutral-0')
})

test('查询结果可直接作为声明受体、条件值和混色输入', () => {
  const ink = paletteColor('neutral', 7)
  handles.push(rule('.Example', ink, 'red'))
  handles.push(rule('.Example', 'color', ink))
  handles.push(rule('.Example', 'background-color', value(paletteColor('neutral', 1), {
    hover: colorMix([paletteColor('neutral', 2), 0.72], 'transparent'),
  })))
  const css = compileCSS()
  expect(css).toContain('--dye-neutral-7: red;')
  expect(css).toContain('color: var(--dye-neutral-7);')
  expect(css).toContain('background-color: var(--dye-neutral-1);')
  expect(css).toContain('color-mix(in oklab, var(--dye-neutral-2) 72%, transparent)')
  expect(css).not.toContain(':root')
})
