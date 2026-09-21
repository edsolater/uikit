/** 验证中性色阶 Cluster 的成员身份、命名与内容组合。 */
import { variable } from '../../core/css-variable'
import { afterEach, expect, test } from 'vitest'
import { compileCSS, rule, type RulesHandle } from '../../index'
import { colorMix } from '../../values/functions/color-mix'
import { neutralColor } from './neutral'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
})

test('default 与数字零指向同一成员，其余数字返回各自声明的 Variable', () => {
  const before = compileCSS()
  expect(neutralColor.name).toBe(neutralColor(0).name)
  for (let level = 0; level <= 8; level++) {
    const color = neutralColor(level as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)
    expect(color.kind).toBe('variable')
    expect(color.name).toBe(`neutral-color-${level}`)
  }
  expect(compileCSS()).toBe(before)
})

test('未声明成员在类型与运行时均不成为另一套色阶查询协议', () => {
  // @ts-expect-error Cluster 只接受实际声明的成员键。
  expect(() => neutralColor('missing')).toThrow()
  // @ts-expect-error Cluster 不把已声明的数字成员宽化为任意 number。
  expect(() => neutralColor(9)).toThrow()
  expect(neutralColor.name).toBe('neutral-color-0')
})

test('成员可直接作为声明目标、声明内容和混色输入', () => {
  const ink = neutralColor(7)
  handles.push(rule('.Example', ink, 'red'))
  handles.push(rule('.Example', 'color', ink))
  handles.push(rule('.Example', 'background-color', variable(neutralColor(1), {
    name: 'browser-neutral-color',
    states: {
      hover: colorMix([neutralColor(2), 0.72], 'transparent'),
    },
  })))
  const css = compileCSS()
  expect(css).toContain('--neutral-color-7: red;')
  expect(css).toContain('color: var(--neutral-color-7, var(--dye-neutral-7));')
  expect(css).toContain('background-color: var(--browser-neutral-color, var(--neutral-color-1, var(--dye-neutral-1)));')
  expect(css).toContain('color-mix(in oklab, var(--neutral-color-2, var(--dye-neutral-2)) 72%, transparent)')
  expect(css).not.toContain(':root')
})
