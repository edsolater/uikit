import { token } from '../token'
/** State Condition 的名称与 Rule 地址。 */
import { expect, test, vi } from 'vitest'
import { condition } from '../condition'
import { rule } from '../rule'
import { compileCSS, compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'
import * as stateConditions from '../pieces/state-conditions'

test('内置状态可由 Token 直接采用', () => {
  const color = token('red', { name: 'state-color', state: { hover: 'blue' } })
  expect(compileRules([[[condition('.Example')], 'color', color]])).toContain('--state-color: blue;')
})
test('未登记的主体条件原样采用，快捷条件仍保留禁用守卫', () => {
  const factory = vi.fn(() => 'blue')
  const color = token('red', { name: 'raw-color', state: { hover: factory, '&[data-tone="danger"]': 'green' } })
  const css = compileRules([[['.RawState'], 'color', color]])
  expect(css).toContain('--raw-color: blue;')
  expect(css).toContain('&[data-tone="danger"] {')
  expect(css).toContain('--raw-color: green;')
  expect(css).toContain(':not(:disabled, [data-status~="disabled"])')
  expect(stateConditions.hasStateCondition('&[data-tone="danger"]')).toBe(false)
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
    [['.Consumer'], 'color', token('black', { onFirstScan: () => [[['.Resource', 'literalState'], 'color', 'blue']] })],
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

test('已登记名称用于状态输出，公开配置保留状态内容', () => {
  const options = { name: 'definition-time-color', state: { definitionTimeState: 'blue' } }
  const earlier = token('red', options)
  const registered = stateCondition('definitionTimeState', condition('&[data-definition-time]'))
  const color = token('red', options)
  expect(compileRules([[['.DefinitionTime'], 'color', color]])).toContain('&:where([data-definition-time])')
})

test('两个自写条件保留输入顺序，状态内容保留来源引用', () => {
  const first = '&[data-first-raw]'
  const second = '&[data-second-raw]'
  const source = token('gray', { name: 'raw-source', state: { [first]: 'blue' } })
  const target = token('red', { name: 'raw-target', state: {
    [first]: () => source,
    active: () => 'black',
    [second]: () => source,
  } })
  const css = compileRules([[[condition('.RawReference')], 'color', target]])
  for (const selector of [first, second]) {
    const escapedCondition = selector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    expect(css).toMatch(new RegExp(`${escapedCondition}[^{}]*\\{[^}]*--raw-target: var\\(--raw-source\\);`))
  }
  expect(css).toContain('--raw-source: blue;')
  expect(css).not.toContain('--raw-target: gray;')
  expect(css).not.toContain('--raw-target: blue;')
})

test('状态输出按登记顺序，默认生产函数保持消费前惰性', () => {
  const first = stateCondition('factoryOrderFirst', condition('&[data-first]'))
  const second = stateCondition('factoryOrderSecond', condition('&[data-second]'))
  const defaultFactory = vi.fn(() => 1)
  const source = token(defaultFactory, { name: 'ordered-state-source', state: {
    factoryOrderSecond: () => 3,
    factoryOrderFirst: () => 2,
  } })
  expect(defaultFactory).not.toHaveBeenCalled()
  const css = compileRules([[['.OrderedStates'], 'opacity', source]])
  expect(css.indexOf('--ordered-state-source: 2;')).toBeLessThan(css.indexOf('--ordered-state-source: 3;'))
})
