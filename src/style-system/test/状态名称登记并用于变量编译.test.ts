/** State Condition 的名称与 Rule 地址。 */
import { expect, test, vi } from 'vitest'
import { condition } from '../condition'
import { variable } from '../variable'
import { rule } from '../rule'
import { value } from '../value'
import { compileCSS, compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'
import * as stateConditions from '../pieces/state-conditions'

test('内置状态可由 Variable 直接采用', () => {
  const color = variable('red', { name: 'state-color', states: { hover: 'blue' } })
  expect(compileRules([[[condition('.Example')], 'color', color]])).toContain('--state-color: blue;')
})
test('未登记的主体条件原样采用，快捷条件仍保留禁用守卫', () => {
  const factory = vi.fn(() => 'blue')
  const color = variable('red', { name: 'raw-color', states: { hover: factory, '&[data-tone="danger"]': 'green' } })
  expect(factory).toHaveBeenCalledOnce()
  const css = compileRules([[['.RawState'], 'color', color]])
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


test('登记只影响之后创建的快捷匹配，不改变已有原始条件', () => {
  const options = { name: 'definition-time-color', states: { definitionTimeState: 'blue' } }
  const earlier = variable('red', options)
  expect([...earlier.config.states.keys()][0].condition.header).toBe('definitionTimeState')
  const registered = stateCondition('definitionTimeState', condition('&[data-definition-time]'))
  const color = variable('red', options)
  expect([...color.config.states.keys()][0]).toBe(registered)
  expect(color.config.states.get(registered)).toBe('blue')
  expect([...earlier.config.states.keys()][0]).not.toBe(registered)
  expect(compileRules([[['.DefinitionTime'], 'color', color]])).toContain('&:where([data-definition-time])')
})

test('两个自写条件保留输入顺序，状态内容保留来源引用', () => {
  const first = '&[data-first-raw]'
  const second = '&[data-second-raw]'
  const events: string[] = []
  const source = variable('gray', { name: 'raw-source', states: { [first]: 'blue' } })
  const target = variable('red', { name: 'raw-target', states: {
    [first]: () => { events.push('first'); return source },
    active: () => { events.push('active'); return 'black' },
    [second]: () => { events.push('second'); return source },
  } })
  expect(events).toEqual(['first', 'active', 'second'])
  const states = [...target.config.states.keys()]
  expect(states.map(state => state.name)).toEqual(['active', first, second])
  expect(states[2].order).toBeGreaterThan(states[1].order)
  const css = compileRules([[[condition('.RawReference')], 'color', target]])
  for (const selector of [first, second]) {
    const escapedCondition = selector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    expect(css).toMatch(new RegExp(`${escapedCondition}[^{}]*\\{[^}]*--raw-target: var\\(--raw-source, gray\\);`))
  }
  expect(css).toContain('--raw-source: blue;')
  expect(css).not.toContain('--raw-target: gray;')
  expect(css).not.toContain('--raw-target: blue;')
})

test('状态输出按登记顺序，创建回调保持输入顺序且不求默认生产函数', () => {
  const first = stateCondition('factoryOrderFirst', condition('&[data-first]'))
  const second = stateCondition('factoryOrderSecond', condition('&[data-second]'))
  const events: string[] = []
  const defaultFactory = vi.fn(() => 1)
  const source = variable(defaultFactory, { name: 'ordered-state-source', states: {
    factoryOrderSecond: (raw) => { expect(raw).toBe(defaultFactory); events.push('second'); return 3 },
    factoryOrderFirst: (raw) => { expect(raw).toBe(defaultFactory); events.push('first'); return 2 },
  } })
  expect(events).toEqual(['second', 'first'])
  expect([...source.config.states.keys()]).toEqual([first, second])
  expect(defaultFactory).not.toHaveBeenCalled()
})
