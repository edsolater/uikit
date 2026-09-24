/** State Condition 的名称与 Rule 地址。 */
import { expect, test } from 'vitest'
import { condition } from '../core/css-condition'
import { variable } from '../core/css-variable'
import { compileRules } from './compile-css'
import { stateCondition } from '../state-conditions'

test('内置状态可由 Variable 直接采用', () => {
  const color = variable('red', { name: 'state-color', states: { hover: 'blue' } })
  expect(compileRules([[[condition('.Example')], 'color', color]])).toContain('--state-color: blue;')
})
test('未知状态不能静默退回常态', () => {
  expect(() => compileRules([[[condition('.Example')], 'color', variable('red', { name: 'unknown-color', states: { unknown: 'blue' } })]])).toThrow('未知 State Condition')
})
test('自定义状态需要唯一名字', () => {
  stateCondition('uniqueState', condition('&[data-unique]'))
  expect(() => stateCondition('uniqueState', condition('&[data-other]'))).toThrow('已登记')
  expect(() => stateCondition('default', condition('&'))).toThrow('default')
})
