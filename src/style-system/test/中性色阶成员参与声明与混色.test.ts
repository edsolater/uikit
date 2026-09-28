/** 验证中性色阶成员作为声明目标、内容及混色输入的完整消费流程。 */
import { variable } from '../variable'
import { afterEach, expect, test } from 'vitest'
import { compileCSS, rule, type RulesHandle } from '../index'
import { colorMix } from '../pieces/contents/combiners/color-mix'
import { neutralColor } from '../pieces/contents/atoms/color/neutral'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
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
  expect(css).toContain('color-mix(in oklab, var(--dye-neutral-2) 72%, transparent)')
  expect(css).not.toContain(':root')
})
