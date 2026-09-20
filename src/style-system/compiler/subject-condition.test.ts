/** State Condition 的名称与 Rule 地址。 */
import { expect, test } from 'vitest'
import { condition } from '../core/css-condition'
import { variable } from '../core/css-variable'
import { resolveRules } from './compile-css'
import { stateCondition, resolveStateConditions } from '../state-conditions'

test('内置状态可由 Variable 直接采用', () => {
  const color = variable('red', { name: 'state-color', states: { hover: 'blue' } })
  expect(resolveRules([[[condition('.Example')], 'color', color]]).some(([path, key, text]) => path.length === 2 && key === '--state-color' && text === 'blue')).toBe(true)
})
test('重复状态去重，未知名称终止编译', () => {
  expect(resolveStateConditions(['active', 'hover', 'active']).map(item => item.name)).toEqual(['hover', 'active'])
  expect(() => resolveRules([[[condition('.Example')], 'color', variable('red', { name: 'unknown-color', states: { unknown: 'blue' } })]])).toThrow('未知 State Condition')
})
test('自定义状态需要唯一名字', () => {
  stateCondition('uniqueState', condition('&[data-unique]'))
  expect(() => stateCondition('uniqueState', condition('&[data-other]'))).toThrow('已登记')
  expect(() => stateCondition('default', condition('&'))).toThrow('default')
})
