/** 稳定组合不会传播 Variable 的状态。 */
import { expect, test, vi } from 'vitest'
import { condition } from '../core/css-condition'
import { cssContent, value } from '../core/css-value'
import { variable, variableFrom } from '../core/css-variable'
import { variableCluster } from '../core/variable-cluster'
import { colorMix } from '../values/functions/color-mix'
import { calcMultiply } from '../values/functions/calc'
import { compileValue } from './compile-value'
import { resolveRules } from './compile-css'
import { compileRules } from './compile-css'
import { cssFunction } from '../values/functions/custom'
import { stateCondition } from '../state-conditions'
import { media } from '../core/css-condition'
import type { Rules } from '../core/css-rule'

stateCondition('functionMedia', media('(width > 1px)'))

test.each([false, true])('状态内引用与普通消费交换顺序不污染常态：%s', (ordinaryFirst) => {
  const inner = variable('10px', { name: 'audit-inner-size', states: { hover: '20px' } })
  const outer = variable('1px', { name: 'audit-outer-size', states: { hover: inner } })
  const rules: Rules = [
    [[condition('.Audit')], 'margin-left', outer],
    [[condition('.Audit')], 'width', inner],
  ]
  const output = resolveRules(ordinaryFirst ? rules.reverse() : rules)
  expect(output.filter(([path, key]) => key === '--audit-inner-size' && path.length === 1))
    .toEqual([[['.Audit'], '--audit-inner-size', '10px']])
  expect(output.filter(([path, key]) => key === '--audit-inner-size' && path.length > 1)
    .every(([, , text]) => text === '20px')).toBe(true)
})

test('依赖先在 active 再在 hover 出现时，自动定义仍按状态优先级输出', () => {
  const inner = variable('10px', { name: 'ordered-inner-size', states: { hover: '20px', active: '30px' } })
  const active = variable('1px', { name: 'ordered-active-size', states: { active: inner } })
  const hover = variable('2px', { name: 'ordered-hover-size', states: { hover: inner } })
  const records = resolveRules([
    [[condition('.Ordered')], 'margin-left', active],
    [[condition('.Ordered')], 'margin-right', hover],
    [[condition('.Ordered')], 'width', inner],
  ])
  expect(records.filter(([, key]) => key === '--ordered-inner-size').map(([, , text]) => text))
    .toEqual(['10px', '20px', '30px', '30px'])
})

test('自动定义排序保留不同普通地址交错出现的位置', () => {
  const shared = variable('10px', { name: 'interleaved-size', states: { hover: '20px' } })
  const records = resolveRules([
    [[condition('.First'), 'hover'], 'width', shared],
    [[condition('.Second')], 'width', shared],
    [[condition('.First')], 'width', shared],
  ])
  expect(records.filter(([, key]) => key === '--interleaved-size').map(([path, , text]) => [path[0], text]))
    .toEqual([['.First', '10px'], ['.Second', '10px'], ['.Second', '20px'], ['.First', '20px']])
})

test('函数的局部 Variable 与 result 留在同一份函数定义', () => {
  const size = variable('16px', { name: 'function-size', states: { functionMedia: '20px' } })
  const content = cssFunction('--measured-size() returns <length>', [[undefined, 'result', size]])()
  const css = compileRules([[[condition('.Example')], 'font-size', content]])
  expect(css.match(/@function --measured-size/g)).toHaveLength(1)
  expect(css).toContain('--function-size: 20px;')
  expect(css).toContain('result: var(--function-size, 16px);')
})

test('三个有状态 Variable 组合只产生一份消费声明', () => {
  const first = variable('black', { name: 'first-color', states: { hover: 'navy', active: 'blue' } })
  const second = variable('white', { name: 'second-color', states: { hover: 'silver', active: 'gray' } })
  const ratio = variable(0.8, { name: 'mix-ratio', states: { hover: 0.7, active: 0.6 } })
  const output = resolveRules([[[condition('.Mix')], 'background', value(colorMix([first, ratio], second))]])
  expect(output.filter(([, key]) => key === 'background')).toHaveLength(1)
  expect(output.filter(([, key]) => key === '--first-color')).toHaveLength(4)
  expect(output.filter(([, key]) => key === '--second-color')).toHaveLength(4)
  expect(output.filter(([, key]) => key === '--mix-ratio')).toHaveLength(4)
  expect(output.every(([path]) => path.length <= 3)).toBe(true)
})
test('延伸保持来源引用，自身覆盖和未定义状态都声明到新名字', () => {
  const source = variable('red', { name: 'source-color', states: { hover: 'pink', active: 'blue', disabled: 'gray' } })
  const derived = variableFrom(source, { name: 'derived-color', states: { active: source => colorMix(source, 'white') } })
  const final = variableFrom(derived, { name: 'final-color', states: { hover: 'green' } })
  const output = resolveRules([[[condition('.Example')], 'color', final]])
  expect(output.some(([, key, text]) => key === '--derived-color' && text === 'color-mix(in oklab, var(--source-color, red), white)')).toBe(true)
  expect(output.some(([, key, text]) => key === '--final-color' && text === 'green')).toBe(true)
  expect(output.filter(([, key]) => key === '--final-color')).toHaveLength(8)
  expect(source.name).toBe('source-color')
  expect('states' in source).toBe(false)
  expect('source' in derived).toBe(false)
})
test('Cluster 直接使用等同默认成员，选择返回原对象并保留状态', () => {
  const normal = variable('red', { name: 'normal-color' })
  const soft = variable('pink', { name: 'soft-color', states: { active: 'purple' } })
  const cluster = variableCluster({ default: normal, soft })
  expect(cluster('soft')).toBe(soft)
  expect(cluster.name).toBe(normal.name)
  const output = resolveRules([[[condition('.Example')], 'color', cluster], [[condition('.Soft')], 'color', cluster('soft')]])
  expect(output.some(([, key, text]) => key === 'color' && text === 'var(--normal-color, red)')).toBe(true)
  expect(output.some(([, key, text]) => key === '--soft-color' && text === 'purple')).toBe(true)
  expect(() => (cluster as (name: string) => unknown)('missing')).toThrow('未定义成员')
})
test('状态直接接收 Cluster 和混色对象，不当成 source 回调', () => {
  const cluster = variableCluster({ default: variable('pink', { name: 'pink-color' }) })
  const source = variable('red', { name: 'red-color', states: { hover: cluster, active: colorMix(cluster, 'white') } })
  expect(() => resolveRules([[[condition('.Example')], 'color', source]])).not.toThrow()
})
test('零值不会沿来源链退回', () => {
  const source = variable(1, { name: 'source-opacity', states: { disabled: 0.5 } })
  const next = variableFrom(source, { name: 'next-opacity', states: { disabled: 0 } })
  expect(resolveRules([[[condition('.Example')], 'opacity', next]]).some(([, key, text]) => key === '--next-opacity' && text === '0')).toBe(true)
})

test('已在 active Rule 内消费时，首次自动声明采用 active 内容', () => {
  const source = variable('red', { name: 'active-color', states: { active: 'blue' } })
  const output = resolveRules([[[condition('.Example'), 'active'], 'color', source]])
  expect(output.filter(([, key]) => key === '--active-color').every(([, , text]) => text === 'blue')).toBe(true)
})

test('延伸的注册使用新名字，来源根值继续按需激活', () => {
  const source = variable('red', { name: 'registered-source-color', root: { value: 'blue' } })
  const next = variableFrom(source, { name: 'registered-next-color', registration: { syntax: '<color>', inherits: true, initialValue: 'black' } })
  const css = compileRules([[[condition('.Example')], 'color', next]])
  expect(css).toContain('@property --registered-next-color')
  expect(css).toContain('--registered-source-color: blue;')
  expect(css).not.toContain('@property --registered-source-color')
})
test('稳定 Value 共享引用不误报循环，真实循环停止', () => {
  const shared = value('red')
  expect(compileValue(colorMix(shared, shared), { root: [], path: [], resolving: new Set(), activate() { }, defineVariable() { } })).toEqual([{ conditions: [], text: 'color-mix(in oklab, red, red)' }])
  const cycle = value(undefined)
  cycle.content = cycle
  expect(() => resolveRules([[[condition('.Cycle')], 'color', cycle]])).toThrow('循环引用')
})
test('内容只在输出时执行，source 回调只在定义时执行', () => {
  const serialize = vi.fn(() => 'blue')
  const callback = vi.fn(() => cssContent(serialize))
  const source = variable('red', { name: 'deferred-color', states: { active: callback } })
  expect(callback).toHaveBeenCalledOnce()
  expect(serialize).not.toHaveBeenCalled()
  resolveRules([[[condition('.Example')], 'color', source]])
  expect(serialize).toHaveBeenCalledOnce()
})
test('声明来源 Variable 不修改其定义，局部显式声明优先', () => {
  const ratio = variable(0.8, { name: 'surface-ratio', states: { hover: 0.6 } })
  const output = resolveRules([[[condition('.Example')], ratio, [['hover', 0.3]]], [[condition('.Example')], 'opacity', calcMultiply(ratio, 0.5)]])
  expect(output.some(([, key, text]) => key === '--surface-ratio' && text === '0.3')).toBe(true)
  expect(output.some(([, key, text]) => key === '--surface-ratio' && text === '0.6')).toBe(false)
})
