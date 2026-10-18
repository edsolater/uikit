/** 稳定组合不会传播 Variable 的状态。 */
import { expect, test, vi } from 'vitest'
import { result } from '@edsolater/fnkit'
import { condition, media } from '../condition'
import { createJSSContent } from '../content'
import { value } from '../value'
import { variable } from '../variable'
import * as variables from '../variable'
import { colorMix } from '../pieces/contents/functions/color-mix'
import { multiply } from '../pieces/contents/functions/calc'
import { compileRules } from '../css-root'
import { appendStateCondition, resolveStateConditions, stateCondition } from '../pieces/state-conditions'
import { rulesToStyleNodes } from '../compiler/rules-to-style-nodes'
import { styleNodesToContentNodes } from '../compiler/style-nodes-to-content-nodes/compilation'
import { contentNodesToCSSString } from '../compiler/content-nodes-to-css-string'

import { cssFunction } from '../css-function'
import type { Rules } from '../rule'

stateCondition('functionMedia', media('(width > 1px)'))

const independentStates = Array.from({ length: 10 }, (_, index) => `independentState${index}`)
for (const name of independentStates) stateCondition(name, condition(`&[data-${name}]`))

test.each([2, 5, 10])('两个变量各有 %i 个状态时，定义数量随状态数增长而不产生交集', (count) => {
  const states = Object.fromEntries(independentStates.slice(0, count).map((name) => [name, '2px']))
  const first = variable('1px', { name: 'independent-first-size', states })
  const second = variable('1px', { name: 'independent-second-size', states })
  const css = compileRules([
    [[condition('.Independent')], 'width', first],
    [[condition('.Independent')], 'height', second],
  ])
  expect(css.match(/--independent-first-size:/g)).toHaveLength(count + 1)
  expect(css.match(/--independent-second-size:/g)).toHaveLength(count + 1)
  expect(css.match(/(?:^|\n)width:/g)).toHaveLength(1)
  expect(css.match(/(?:^|\n)height:/g)).toHaveLength(1)
})

test.each([false, true])('状态内引用与普通消费交换顺序后，依赖仍有常态和自身状态：%s', (ordinaryFirst) => {
  const inner = variable('10px', { name: 'audit-inner-size', states: { hover: '20px' } })
  const outer = variable('1px', { name: 'audit-outer-size', states: { hover: inner } })
  const source: Rules = [
    [[condition('.Audit')], 'margin-left', outer],
    [[condition('.Audit')], 'width', inner],
  ]
  const css = compileRules(ordinaryFirst ? source.reverse() : source)
  expect(css.match(/--audit-inner-size:/g)).toHaveLength(2)
  expect(css).toContain('--audit-inner-size: 10px;')
  expect(css).toContain('--audit-inner-size: 20px;')
})

test('函数的局部 Variable 与 result 留在同一份函数定义', () => {
  const size = variable('16px', { name: 'function-size', states: { functionMedia: '20px' } })
  const content = cssFunction('--measured-size() returns <length>', [[undefined, 'result', size]])()
  const css = compileRules([[[condition('.Example')], 'font-size', content]])
  expect(css.match(/@function --measured-size/g)).toHaveLength(1)
  expect(css).toContain('--function-size: 20px;')
  expect(css).toContain('result: var(--function-size);')
})

test('多个有状态变量组合时，消费属性仍只有一份声明', () => {
  const first = variable('black', { name: 'first-color', states: { hover: 'navy', active: 'blue' } })
  const second = variable('white', { name: 'second-color', states: { hover: 'silver', active: 'gray' } })
  const ratio = variable(0.8, { name: 'mix-ratio', states: { hover: 0.7, active: 0.6 } })
  const css = compileRules([[[condition('.Mix')], 'background', value(colorMix([first, ratio], second))]])
  expect(css.match(/(?:^|\n)background:/g)).toHaveLength(1)
  expect(css).toContain('--first-color: navy;')
  expect(css).toContain('--second-color: silver;')
  expect(css).toContain('--mix-ratio: 0.7;')
})

test('共享 Value 在不同地址分别解析，重复编译不修改来源对象', () => {
  const source = variable('2px', { name: 'shared-position-size', states: { hover: '4px' } })
  const shared = value(source)
  const rules: Rules = [
    [[condition('.AuditA')], 'width', shared],
    [[condition('.AuditB')], 'width', shared],
  ]
  const compileAndCheck = () => {
    const css = compileRules(rules)
    expect(css).toMatch(/:root\s*\{[^}]*--shared-position-size:\s*2px;/)
    expect(css).toMatch(/\.AuditA[\s\S]*--shared-position-size:\s*4px;/)
    expect(css).toMatch(/\.AuditB[\s\S]*--shared-position-size:\s*4px;/)
  }

  compileAndCheck()
  expect(shared.content).toBe(source)
  compileAndCheck()
  expect(shared.content).toBe(source)
})
test('创建时绑定 Name，后续替换尝试不改变引用、默认声明与状态', () => {
  const name = variables.variableName('bound-size')
  const target = variable('1px', { name, states: { hover: '2px' } })
  try { Reflect.set(target, 'name', variables.variableName('replacement-size')) } catch {}
  expect(target.name).toBe(name)

  const css = compileRules([[[condition('.Renamed')], 'width', target]])
  expect(css).toContain('width: var(--bound-size);')
  expect(css).toContain('--bound-size: 1px;')
  expect(css).toContain('--bound-size: 2px;')
  expect(css).not.toContain('--replacement-size')
})
test('零值不会沿来源链退回', () => {
  const source = variable(1, { name: 'source-opacity', states: { disabled: 0.5 } })
  const next = variable(source, { name: 'next-opacity', states: { disabled: 0 } })
  expect(compileRules([[[condition('.Example')], 'opacity', next]])).toContain('--next-opacity: 0;')
})

test('已在 active Rule 内消费时，首次自动声明采用 active 内容', () => {
  const source = variable('red', { name: 'active-color', states: { active: 'blue' } })
  const css = compileStateFixture([[[condition('.Example')], 'color', source]], 'active')
  expect(css).toContain('--active-color: blue;')
  expect(css).toMatch(/:root\s*\{[^}]*--active-color: red;/)
})

test('延伸的注册使用新名字，来源默认值继续按需读取', () => {
  const source = variable('blue', { name: 'registered-source-color' })
  const next = variable(source, { name: 'registered-next-color', registration: { syntax: '<color>', inherits: true, initialValue: 'black' } })
  const css = compileRules([[[condition('.Example')], 'color', next]])
  expect(css).toContain('@property --registered-next-color')
  expect(css).toContain('var(--registered-source-color)')
  expect(css).not.toContain('@property --registered-source-color')
})
test('稳定 Value 共享引用不误报循环，真实循环停止', () => {
  const shared = value('red')
  expect(compileRules([[[condition('.Shared')], 'color', colorMix(shared, shared)]]))
    .toContain('color: color-mix(in oklab, red, red);')
  const cycle = value<import('../value').ValueData>(undefined)
  cycle.content = cycle
  expect(() => compileRules([[[condition('.Cycle')], 'color', cycle]])).toThrow('循环引用')
})
test('动态内容没有被消费时不执行，消费时产生 CSS', () => {
  const serialize = vi.fn(() => 'blue')
  const source = variable(createJSSContent(serialize), { name: 'deferred-color' })
  expect(serialize).not.toHaveBeenCalled()
  expect(compileRules([[[condition('.Example')], 'color', source]])).toContain('color: var(--deferred-color);')
  expect(serialize).toHaveBeenCalled()
})
test('声明来源 Variable 不修改其定义，局部显式声明优先', () => {
  const ratio = variable(0.8, { name: 'surface-ratio', states: { hover: 0.6 } })
  const css = compileStateFixture([[[condition('.Example')], ratio, 0.3], [[condition('.Example')], 'opacity', multiply(ratio, 0.5)]], 'hover')
  expect(css).toContain('--surface-ratio: 0.3;')
  expect(css).not.toContain('--surface-ratio: 0.6;')
})

test('显式 Variable 局部分支保留其消费状态，状态内容的临时条件不扩散', () => {
  const inner = variable('10px', { name: 'branch-inner-size', states: { hover: '20px', active: '30px' } })
  const target = variable(undefined, { name: 'branch-target-size' })
  const css = compileStateFixture([[[condition('.BranchScope')], target, inner]], 'active')
  expect(css).toContain('--branch-inner-size: 30px;')
  expect(css).not.toContain('--branch-inner-size: 20px;')
})

/** 显式构造内部状态节点，区别于公开 Rules 的普通条件。 */
function compileStateFixture(input: import('../rule').Rules, state: string): string {
  const nodes = rulesToStyleNodes(input)
  nodes[0].conditionPath = appendStateCondition(nodes[0].conditionPath, resolveStateConditions([state])[0])
  return contentNodesToCSSString(styleNodesToContentNodes(nodes, input))
}


test('两个具体Variable的onActive各自执行一次，共享引用不重复', () => {
  const directActive = vi.fn((): Rules => [[[condition(':root')], '--direct-active', '1']])
  const direct = variable('red', { name: 'generic-active-variable', onActive: directActive })
  const defaultActive = vi.fn((): Rules => [[[condition(':root')], '--second-active', '1']])
  const defaultMember = variable('blue', { name: 'generic-active-second', onActive: defaultActive })

  const css = compileRules([
    [[condition('.GenericActivation')], 'color', direct],
    [[condition('.GenericActivation')], 'background', defaultMember],
  ])

  expect(directActive).toHaveBeenCalledTimes(1)
  expect(defaultActive).toHaveBeenCalledTimes(1)
  expect(css).toContain('--direct-active: 1;')
  expect(css).toContain('--second-active: 1;')
})
