/** 验证 CSS 记录的原子挂载与深度优先顺序。 */
import { expect, test } from 'vitest'
import { subjectCondition } from '../subject-conditions'
import { condition } from '../core/css-condition'
import { mountCSSRecord, type CSSRecord } from './css-records'
import { resolveRules, stringifyCSS } from './compile-css'
import { value } from '../core/css-value'
import type { Rules, RuleAddress, RuleValue } from '../core/css-rule'

subjectCondition('testHover', condition('&:hover'))

test('挂载时形成三元组数组，父声明先于连续子树', () => {
  const button = '.Button'
  const hover = '&:hover'
  const active = '&:active'
  const child = '& > span'
  const records: CSSRecord[] = []
  mountCSSRecord(records, [[button, hover, child], 'color', 'white'])
  mountCSSRecord(records, [[button, active], 'color', 'green'])
  mountCSSRecord(records, [[button], 'background', 'black'])
  mountCSSRecord(records, [[button, hover], 'background', 'navy'])
  mountCSSRecord(records, [[button], 'border', 'none'])
  mountCSSRecord(records, [[button, hover], 'border', 'solid'])
  expect(records).toEqual([
    [[button], 'background', 'black'],
    [[button], 'border', 'none'],
    [[button, hover], 'background', 'navy'],
    [[button, hover], 'border', 'solid'],
    [[button, hover, child], 'color', 'white'],
    [[button, active], 'color', 'green'],
  ])
  expect(records.every((record) => record.length === 3)).toBe(true)
  const position = records.findIndex(([, key]) => key === 'border')
  mountCSSRecord(records, [[button], 'border', 'dashed'])
  expect(records[position]).toEqual([[button], 'border', 'dashed'])
  expect(records).toHaveLength(6)
  expect(stringifyCSS(records).match(/&:hover \{/g)).toHaveLength(1)
})

test('挂载器只接收最终路径，保留普通路径顺序与重复项', () => {
  const button = '.Button'
  const hover = '&:hover'
  const active = '&:active'
  const records: CSSRecord[] = []
  mountCSSRecord(records, [[button, undefined], 'color', 'red'])
  mountCSSRecord(records, [[button, active, hover, hover], 'color', 'navy'])
  expect(records).toEqual([[[button], 'color', 'red'], [[button, active, hover, hover], 'color', 'navy']])
})

test('Rules 解析挂载与字符串转换保持两个独立边界', () => {
  const button = '.Button'
  const hover = '&:hover'
  const source: Rules = new Map([
    [[[condition(button)], 'background'], value('black', [['testHover', 'navy']])],
    [[[condition(button)], 'border'], value('none', [['testHover', 'solid']])],
  ])
  const records = resolveRules(source)
  expect(records).toEqual([
    [[button], 'background', 'black'], [[button], 'border', 'none'],
    [[button, hover], 'background', 'navy'], [[button, hover], 'border', 'solid'],
  ])
  expect(stringifyCSS(records)).toBe('.Button {\nbackground: black;\nborder: none;\n&:hover {\nbackground: navy;\nborder: solid;\n}\n}')
})

test('字符串转换忽略 default 块头，并保持无 Key 内容', () => {
  const records: CSSRecord[] = [
    [[undefined, '.Button'], 'color', 'red'],
    [['.Button', undefined, '&:hover'], undefined, '/* 悬停内容 */'],
  ]
  expect(stringifyCSS(records)).toBe('.Button {\ncolor: red;\n&:hover {\n/* 悬停内容 */\n}\n}')
})

test('具名定义整体替换时保留原兄弟位置，旧子树退出', () => {
  const definition = condition('@function --example-size() returns <length>')
  const oldBody: Rules = new Map([[[[definition], '--old-size'], '12px'], [[[definition, condition('@media (width > 1px)')], 'result'], '20px']])
  const nextBody: Rules = new Map([[[[definition], 'result'], '24px']])
  const source: Rules = new Map<RuleAddress, RuleValue>([
    [[undefined, undefined], oldBody],
    [[[condition('.Between')], 'color'], 'red'],
    [[undefined, undefined], nextBody],
  ])
  expect(resolveRules(source)).toEqual([
    [[definition.header], 'result', '24px'],
    [['.Between'], 'color', 'red'],
  ])
})
