/** 验证纸色、墨色和中性色变量作为声明目标、内容及混色输入的消费流程。 */
import { variable } from '../variable'
import { afterEach, expect, test } from 'vitest'
import { compileCSS, rule, type RulesHandle } from '../index'
import { colorMix } from '../pieces/contents/functions/color-mix'
import { paperColor, inkColor, neutralColor } from '../pieces/contents/atoms/color/colors'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
})

test('材料变量可作为声明目标、声明内容和混色输入', () => {
  handles.push(rule('.Example', inkColor, 'red'))
  handles.push(rule('.Example', 'color', inkColor))
  handles.push(rule('.Example', 'background-color', variable(paperColor, {
    name: 'sample-surface-color',
    states: { hover: colorMix([neutralColor, 0.72], 'transparent') },
  })))
  const css = compileCSS()
  expect(css).toContain('--ink-color: red;')
  expect(css).toContain('color: var(--ink-color, oklch(')
  expect(css).toContain('background-color: var(--sample-surface-color, var(--paper-color, oklch(')
  expect(css).toContain('color-mix(in oklab, oklch(')
  expect(css).toContain('72%, transparent)')
  expect(css).not.toMatch(/var\(--(?:color-|dye-)/)
  expect(css).not.toContain(':root')
})
