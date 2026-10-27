/** State Condition 的名称与 Rule 地址。 */
import { stateCondition } from '../state-condition'
import { token } from '../token'
import { expect, test, vi } from 'vitest'
import { condition } from '../condition'
import { rule } from '../rule'
import { compileCSS, compileRules } from '../css-root'

test('内置状态可由 Token 直接采用', () => {
  const color = token('red', { name: 'state-color', state: { hover: 'blue' } })
  expect(compileRules([[[condition('.Example')], 'color', color]])).toContain(
    '--state-color: blue;',
  )
})
test('StateCondition 对象无需登记，hover 快捷条件保留纯交互语义', () => {
  const factory = vi.fn(() => 'blue')
  const color = token('red', {
    name: 'raw-color',
    state: [
      ['hover', factory],
      [stateCondition('&[data-tone="danger"]'), 'green'],
    ],
  })
  const css = compileRules([[['.RawState'], 'color', color]])
  expect(css).toContain('--raw-color: blue;')
  expect(css).toContain('&[data-tone="danger"] {')
  expect(css).toContain('--raw-color: green;')
  expect(css).not.toContain(':not(:disabled, [data-status~="disabled"])')
})

test('公开、嵌套和按需 Rules 的字符串保留原始地址含义', () => {
  const direct = rule(['.Literal', 'literalState'], 'color', 'red')
  const hoverTag = rule(['.Literal', 'hover'], 'color', 'red')
  const unknown = rule(['.Literal', 'unknownSelector'], 'color', 'red')
  const raw = () =>
    compileRules([
      [['.Raw', 'literalState'], 'color', 'red'],
      [['.Nested'], undefined, [[['literalState'], 'width', '1px']]],
      [
        ['.Consumer'],
        'color',
        token('black', {
          onFirstScan: () => [[['.Resource', 'literalState'], 'color', 'blue']],
        }),
      ],
    ])
  try {
    const css = raw()
    expect(compileCSS()).toContain('literalState {')
    expect(compileCSS()).toContain('hover {')
    expect(compileCSS()).toContain('unknownSelector {')
    expect(css).toMatch(/\.Raw\s*\{\s*literalState\s*\{\s*color: red;/)
    expect(css).toMatch(/\.Nested\s*\{\s*literalState\s*\{\s*width: 1px;/)
    expect(css).toMatch(/\.Resource\s*\{\s*literalState\s*\{\s*color: blue;/)
    expect(
      compileRules([[['.Unknown', 'unknownSelector'], 'color', 'red']]),
    ).toContain('unknownSelector {')
  } finally {
    direct.remove()
    hoverTag.remove()
    unknown.remove()
  }
})

test('两个自写条件保留输入顺序，状态内容保留来源引用', () => {
  const first = '&[data-first-raw]'
  const second = '&[data-second-raw]'
  const source = token('gray', {
    name: 'raw-source',
    state: [[stateCondition(first), 'blue']],
  })
  const target = token('red', {
    name: 'raw-target',
    state: [
      [stateCondition(first), () => source],
      ['active', () => 'black'],
      [stateCondition(second), () => source],
    ],
  })
  const css = compileRules([[[condition('.RawReference')], 'color', target]])
  for (const selector of [first, second]) {
    const escapedCondition = selector
      .slice(1)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    expect(css).toMatch(
      new RegExp(
        `${escapedCondition}[^{}]*\\{[^}]*--raw-target: var\\(--raw-source\\);`,
      ),
    )
  }
  expect(css).toContain('--raw-source: blue;')
  expect(css).not.toContain('--raw-target: gray;')
  expect(css).not.toContain('--raw-target: blue;')
})

test('状态输出按定义顺序，默认生产函数保持消费前惰性', () => {
  const factoryOrderFirst = stateCondition('&[data-first]')
  const factoryOrderSecond = stateCondition('&[data-second]')
  const defaultFactory = vi.fn(() => 1)
  const source = token(defaultFactory, {
    name: 'ordered-state-source',
    state: [
      [factoryOrderSecond, () => 3],
      [factoryOrderFirst, () => 2],
    ],
  })
  expect(defaultFactory).not.toHaveBeenCalled()
  const css = compileRules([[['.OrderedStates'], 'opacity', source]])
  expect(css.indexOf('--ordered-state-source: 3;')).toBeLessThan(
    css.indexOf('--ordered-state-source: 2;'),
  )
})
