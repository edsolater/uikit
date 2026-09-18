/** 验证 Subject Condition 的预装名称、Rule 地址与 Value 组合。 */
import { afterEach, expect, test } from 'vitest'
import { subjectCondition } from '../subject-conditions'
import { condition } from '../core/css-condition'
import { compileCSS } from '../core/css-root'
import { rule, type RulesHandle } from '../core/css-rule'
import { value } from '../core/css-value'
import { calcMultiply } from '../values/functions/calc'

const handles: RulesHandle[] = []
const custom = subjectCondition('testSubjectRule', condition('&[data-subject]'))

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
})

test('只导入编译入口即可把内置名称解析为已有 Condition', () => {
  handles.push(rule('.Subject', 'color', value('red', [['hover', 'blue']])))
  expect(compileCSS()).toBe('.Subject {\ncolor: red;\n&:where(:hover):where(:not(:disabled, [data-status~="disabled"])) {\ncolor: blue;\n}\n}')
})

test('Rule 地址使用预装或自定义名称，普通 CSS 地址保持原样', () => {
  handles.push(rule(['.Subject', 'active', 'focusWithin', 'active'], 'color', 'red'))
  handles.push(rule(['.Subject', custom.name], 'background', 'blue'))
  handles.push(rule(['.Subject', '&[data-raw]'], 'border-color', 'green'))
  expect(compileCSS()).toBe('.Subject {\n&:focus-within {\n&:where(:active):where(:not(:disabled, [data-status~="disabled"])) {\ncolor: red;\n}\n}\n&[data-subject] {\nbackground: blue;\n}\n&[data-raw] {\nborder-color: green;\n}\n}')
})

test('两个普通 Value 的不同分支形成逐层嵌套的条件交集', () => {
  handles.push(rule('.Subject', 'width', calcMultiply(value('2px', [['hover', '4px']]), value(2, [['active', 3]]))))
  const css = compileCSS()
  expect(css.match(/width:/g)).toHaveLength(4)
  expect(css).toContain('&:where(:hover):where(:not(:disabled, [data-status~="disabled"])) {\n&:where(:active):where(:not(:disabled, [data-status~="disabled"])) {\nwidth: calc(4px * 3);')
})

test('未知名称终止整个编译', () => {
  handles.push(rule('.Subject', 'color', value('red', [['unknown-subject', 'blue']])))
  expect(() => compileCSS()).toThrow('未知 Subject Condition')
})
