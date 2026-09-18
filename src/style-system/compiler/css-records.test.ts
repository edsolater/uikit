/** 验证记录顺序、相邻路径共享与字符串输出。 */
import { expect, test } from 'vitest'
import { condition } from '../core/css-condition'
import type { Rules } from '../core/css-rule'
import { subjectCondition } from '../subject-conditions'
import { value } from '../core/css-value'
import type { CSSRecord } from './css-records'
import { resolveRules, stringifyCSS } from './compile-css'

subjectCondition('testHover', condition('&:hover'))

test('记录只有三项；挂载保留交错声明，不重排或吞掉原生覆盖', () => {
  const input: CSSRecord[] = [
    [['.Button', '&:hover'], 'padding', '1px'],
    [['.Button'], 'padding-left', '2px'],
    [['.Button', '&:hover'], 'padding', '3px'],
  ]
  const output = resolveRules(input.map(([headers, key, content]) => [headers.map((header) => condition(header!)), key, content]))
  expect(output).toEqual(input)
  expect(output.every((record) => record.length === 3)).toBe(true)
  expect(stringifyCSS(output)).toBe('.Button {\n&:hover {\npadding: 1px;\n}\npadding-left: 2px;\n&:hover {\npadding: 3px;\n}\n}')
})

test('相邻同目标声明共享嵌套块，不复制 hover', () => {
  const records: CSSRecord[] = [
    [['.Button', '&:hover'], 'color', 'red'],
    [['.Button', '&:hover'], 'border-color', 'blue'],
  ]
  expect(stringifyCSS(records)).toBe('.Button {\n&:hover {\ncolor: red;\nborder-color: blue;\n}\n}')
})

test('普通路径的重复项保留，default 不生成块头', () => {
  const records: CSSRecord[] = [
    [[undefined, '.Button'], 'color', 'red'],
    [['.Button', undefined, '&:hover', '&:hover'], undefined, '/* 悬停内容 */'],
  ]
  expect(stringifyCSS(records)).toBe('.Button {\ncolor: red;\n&:hover {\n&:hover {\n/* 悬停内容 */\n}\n}\n}')
})

test('Rule 解析与字符串输出分开，候选顺序在挂载前确定', () => {
  const source: Rules = [
    [[condition('.Button')], 'color', value('black', { testHover: 'navy' })],
    [[condition('.Button')], 'border', 'none'],
  ]
  expect(resolveRules(source)).toEqual([
    [['.Button'], 'color', 'black'],
    [['.Button', '&:hover'], 'color', 'navy'],
    [['.Button'], 'border', 'none'],
  ])
})

test('显式结构不按 header 猜测定义身份，原始规则顺序保留', () => {
  const definition = condition('@function --size() returns <length>')
  const source: Rules = [
    [[definition], 'result', '12px'],
    [[condition('.Between')], 'color', 'red'],
    [[definition], 'result', '24px'],
  ]
  expect(resolveRules(source)).toEqual([
    [[definition.header], 'result', '12px'],
    [['.Between'], 'color', 'red'],
    [[definition.header], 'result', '24px'],
  ])
})
