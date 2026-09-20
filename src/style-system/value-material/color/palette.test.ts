/** 验证色板 Variable Cluster 的查询身份、命名和原生变量消费。 */
import { variable } from '../../core/css-variable'
import { afterEach, expect, test } from 'vitest'
import { compileCSS, rule, value, type RulesHandle } from '../../index'
import { colorMix } from '../../values/functions/color-mix'
import { neutralColor } from './palette'

const handles: RulesHandle[] = []
afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
})

test('省略等级等于第零级，重复查询返回同一个预定义 Variable', () => {
  const before = compileCSS()
  expect(neutralColor.name).toBe(neutralColor(0).name)
  for (let level = 0;level <= 8;level++) {
    const color = neutralColor(level)
    expect(color.kind).toBe('variable')
    expect(color.name).toBe(level === 0 ? 'neutral-base-color' : `neutral-${level}-color`)
    expect(neutralColor(level)).toBe(color)
  }
  expect(compileCSS()).toBe(before)
})

test('不存在的色系或等级报错，不创建颜色、不回退到零级', () => {
  // @ts-expect-error 未定义的色系也必须在编译期拒绝。
  expect(() => neutralColor('missing')).toThrow()
  for (const level of [-1, 9, 0.5, NaN, Infinity]) {
    expect(() => neutralColor(level)).toThrow()
  }
  expect(neutralColor.name).toBe('neutral-base-color')
})

test('查询结果可直接作为声明受体、条件值和混色输入', () => {
  const ink = neutralColor(7)
  handles.push(rule('.Example', ink, 'red'))
  handles.push(rule('.Example', 'color', ink))
  handles.push(rule('.Example', 'background-color', variable(neutralColor(1), {
    name: "browser-palette-color", states: {
      hover: colorMix([neutralColor(2), 0.72], 'transparent'),
    }
  })))
  const css = compileCSS()
  expect(css).toContain('--neutral-7-color: red;')
  expect(css).toContain('color: var(--neutral-7-color, var(--dye-neutral-7));')
  expect(css).toContain('background-color: var(--browser-palette-color, var(--neutral-1-color, var(--dye-neutral-1)));')
  expect(css).toContain('color-mix(in oklab, var(--neutral-2-color, var(--dye-neutral-2)) 72%, transparent)')
  expect(css).not.toContain(':root')
})
