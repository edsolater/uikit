/** State Condition 的名称与 Rule 地址。 */
import { expect, test } from 'vitest'
import { condition } from '../condition'
import { variable } from '../variable'
import { rule, value } from '../index'
import { compileCSS, compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'

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


test('公开、原始、嵌套和按需 Rules 的字符串不因状态登记改变含义', () => {
  const direct = rule(['.Literal', 'literalState'], 'color', 'red')
  const registered = rule(['.Literal', 'hover'], 'color', 'red')
  const unknown = rule(['.Literal', 'unknownSelector'], 'color', 'red')
  const raw = () => compileRules([
    [['.Raw', 'literalState'], 'color', 'red'],
    [['.Nested'], undefined, [[['literalState'], 'width', '1px']]],
    [['.Consumer'], 'color', value('black', { onActive: () => [[['.Resource', 'literalState'], 'color', 'blue']] })],
  ])
  try {
    const before = raw()
    stateCondition('literalState', condition('&[data-literal]'))
    expect(raw()).toBe(before)
    const later = rule(['.RegisteredLater', 'literalState'], 'color', 'blue')
    try { expect(compileCSS()).toContain('.RegisteredLater {\nliteralState {') } finally { later.remove() }
    expect(compileCSS()).toContain('literalState {')
    expect(compileCSS()).toContain('hover {')
    expect(compileCSS()).toContain('unknownSelector {')
    expect(before).toContain('literalState {')
    expect(before).not.toContain('[data-literal]')
    expect(compileRules([[['.Unknown', 'unknownSelector'], 'color', 'red']])).toContain('unknownSelector {')
  } finally { direct.remove(); registered.remove(); unknown.remove() }
})
