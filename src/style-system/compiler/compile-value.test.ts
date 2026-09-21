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

// 这里只用现有内部登记机制建立测试条件，不要求 Variable 使用者额外注册内置状态。
const linearStateNames = Array.from({ length: 10 }, (_, index) => `linearState${index}`)
for (const name of linearStateNames) stateCondition(name, condition(`&:where([data-${name}])`))

// 用户明确要求：Variable 各自声明状态，不自动扩散；本夹具有两个 Variable，各有 count 个状态和一个常态。
// Agent 实现假设：当前声明节点是 [路径, 键, 值]，一项状态占一个路径段。
// 路径表示可以随实现替换；跨任务须重新审查，不得为了保留此断言而恢复旧节点结构。
test.each([2, 5, 10])('两个独立 Variable 各有 %i 个状态时，节点与求值次数均线性增长', (count) => {
  const evaluate = vi.fn(() => '1px')
  const content = cssContent(evaluate)
  const states = Object.fromEntries(linearStateNames.slice(0, count).map(name => [name, content]))
  const first = variable(content, { name: 'linear-first-size', states })
  const second = variable(content, { name: 'linear-second-size', states })
  const records = resolveRules([
    [[condition('.Linear')], 'width', first],
    [[condition('.Linear')], 'height', second],
  ])
  const declarations = records.filter(([, key]) => key === '--linear-first-size' || key === '--linear-second-size')
  // Agent 实现假设，需质疑：以内容求值次数 <= 2 * (count + 1) 代理线性工作量。
  // 用户未要求每项只求值一次；不同线性算法可能有更大的常数，缓存也可能掩盖内部枚举。
  // 此上限只服务本轮诊断，不能单独证明复杂度；跨任务应重新评估或替换，禁止当作永久契约。
  expect.soft(evaluate.mock.calls.length).toBeLessThanOrEqual(2 * (count + 1))
  expect.soft(declarations).toHaveLength(2 * (count + 1))
  for (const name of ['--linear-first-size', '--linear-second-size']) {
    expect.soft(declarations.filter(([, key]) => key === name)).toHaveLength(count + 1)
    expect.soft(declarations.filter(([path, key]) => key === name && path.length === 1)).toHaveLength(1)
    // 检查具体条件，防止把多状态拼进一个路径段后绕过长度检查。
    const actualConditions = declarations.filter(([path, key]) => key === name && path.length > 1)
      .map(([path]) => path.slice(1).join(' ')).sort()
    expect.soft(actualConditions).toEqual(linearStateNames.slice(0, count)
      .map(state => `&:where(:where([data-${state}]))`).sort())
  }
  expect(declarations.every(([path]) => path.length <= 2)).toBe(true)
})

// 用户明确给出的实现示例：两个 Variable 各有常态、hover、active，共六个声明节点，无自动交集。
// Agent 实现假设：通过 path.length 与选择器文字识别状态；节点结构改变时应替换识别方式。
test('两个 Variable 的 hover 与 active 只形成六个声明节点，不自动生成交集', () => {
  const first = variable('red', { name: 'linear-first-color', states: { hover: 'pink', active: 'darkred' } })
  const second = variable('green', { name: 'linear-second-color', states: { hover: 'lightgreen', active: 'darkgreen' } })
  const records = resolveRules([
    [[condition('.LinearColors')], 'background-color', first],
    [[condition('.LinearColors')], 'color', second],
  ])
  const declarations = records.filter(([, key]) => key?.startsWith('--linear-'))
  expect.soft(declarations).toHaveLength(6)
  expect.soft(declarations.filter(([path]) => path.length === 1)).toHaveLength(2)
  expect.soft(declarations.filter(([path]) => path.length === 2 && path[1]?.includes(':hover'))).toHaveLength(2)
  expect.soft(declarations.filter(([path]) => path.length === 2 && path[1]?.includes(':active'))).toHaveLength(2)
  expect(declarations.every(([path]) => !(path.join(' ').includes(':hover') && path.join(' ').includes(':active')))).toBe(true)
})

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
  // Agent 实现假设，需质疑：状态内引用仍将来源的三项独立定义输出在共同主体上。
  // 本断言不能用来强制未来实现采用相同的内部依赖放置方式；需结合状态实际取值复核。
  expect(records.filter(([, key]) => key === '--ordered-inner-size').map(([, , text]) => text))
    .toEqual(['10px', '20px', '30px'])
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
  expect(output.filter(([, key]) => key === '--first-color')).toHaveLength(3)
  expect(output.filter(([, key]) => key === '--second-color')).toHaveLength(3)
  expect(output.filter(([, key]) => key === '--mix-ratio')).toHaveLength(3)
  expect(output.every(([path]) => path.length <= 2)).toBe(true)
})
test('延伸保持来源引用，自身覆盖和未定义状态都声明到新名字', () => {
  const source = variable('red', { name: 'source-color', states: { hover: 'pink', active: 'blue', disabled: 'gray' } })
  const derived = variableFrom(source, { name: 'derived-color', states: { active: source => colorMix(source, 'white') } })
  const final = variableFrom(derived, { name: 'final-color', states: { hover: 'green' } })
  const output = resolveRules([[[condition('.Example')], 'color', final]])
  expect(output.some(([, key, text]) => key === '--derived-color' && text === 'color-mix(in oklab, var(--source-color, red), white)')).toBe(true)
  expect(output.some(([, key, text]) => key === '--final-color' && text === 'green')).toBe(true)
  // Agent 实现假设，需质疑：延伸链把三个有效状态平铺到最终名字，连常态共四项。
  // 用户要求不自动扩散，但未固定延伸链如何复用声明；跨任务不得将四项当作唯一合法表示。
  expect(output.filter(([, key]) => key === '--final-color')).toHaveLength(4)
  expect(source.name).toBe('source-color')
  // Agent 当前封装假设：内部配置不作为公开字段；这不是由本轮“不扩散”要求推出的约束。
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

test('Cluster 声明按目标同名成员整组展开，允许来源额外成员', () => {
  const target = variableCluster({
    default: variable('black', { name: 'target-color' }),
    soft: variable('gray', { name: 'target-soft-color' }),
    strong: variable('navy', { name: 'target-strong-color' }),
    foreground: variable('white', { name: 'target-foreground-color' }),
  })
  const source = variableCluster({
    default: variable('red', { name: 'source-color' }),
    soft: variable('pink', { name: 'source-soft-color', states: { hover: 'purple' } }),
    strong: variable('maroon', { name: 'source-strong-color' }),
    foreground: variable('yellow', { name: 'source-foreground-color' }),
    line: variable('orange', { name: 'source-line-color' }),
  })
  const output = resolveRules([[[condition('.Cluster')], target, source]])
  expect(output.filter(([, key]) => key?.startsWith('--target-')).map(([, key, text]) => [key, text])).toEqual([
    ['--target-color', 'var(--source-color, red)'],
    ['--target-soft-color', 'var(--source-soft-color, pink)'],
    ['--target-strong-color', 'var(--source-strong-color, maroon)'],
    ['--target-foreground-color', 'var(--source-foreground-color, yellow)'],
  ])
  expect(output.some(([, key]) => key === '--source-line-color')).toBe(false)
  const plain = variable(undefined, { name: 'plain-color' })
  expect(resolveRules([[[condition('.Plain')], plain, source]]))
    .toEqual([[['.Plain'], '--plain-color', 'var(--source-color, red)']])
  expect(target('soft').name).toBe('target-soft-color')
})

test('Cluster 忽略未匹配成员，只拒绝已匹配目标别名的不同来源', () => {
  const shared = variable('1px', { name: 'alias-size' })
  const target = variableCluster({ default: shared, 0: shared })
  const first = variable('2px', { name: 'first-size' })
  const second = variable('3px', { name: 'second-size' })
  expect(resolveRules([[undefined, target, variableCluster({ default: first })]]))
    .toEqual([[[], '--alias-size', 'var(--first-size, 2px)']])
  expect(() => resolveRules([[undefined, target, variableCluster({ default: first, 0: second })]]))
    .toThrow('同名目标存在对象或来源冲突')
  const sameName = variableCluster({ default: shared, 0: variable('9px', { name: shared.name }) })
  expect(() => resolveRules([[undefined, sameName, variableCluster({ default: first, 0: second })]]))
    .toThrow('同名目标存在对象或来源冲突')
  expect(() => resolveRules([[undefined, sameName, variableCluster({ default: first, 0: first })]]))
    .toThrow('同名目标存在对象或来源冲突')
  expect(resolveRules([[undefined, target, variableCluster({ default: first, 0: first })]]))
    .toEqual([[[], '--alias-size', 'var(--first-size, 2px)']])
})

test('Cluster 自身成员赋值不产生 CSS 自循环，不同对象同名引用明确报错', () => {
  const size = variable('1px', { name: 'self-size' })
  const target = variableCluster({ default: size })
  expect(resolveRules([[undefined, target, target]])).toEqual([])
  expect(() => resolveRules([[undefined, target, variableCluster({ default: variable('2px', { name: size.name }) })]]))
    .toThrow('不同对象引用同名变量 --self-size')
})

test('Cluster 只激活双方同名成员，未匹配的目标与来源均不激活', () => {
  const targetSize = variable('1px', { name: 'activated-target-size' })
  const sourceSize = variable('2px', { name: 'activated-source-size' })
  const unused = variable('3px', { name: 'unused-source-size' })
  const targetActive = vi.fn()
  const sourceActive = vi.fn()
  const unusedActive = vi.fn()
  targetSize.onActive = targetActive
  sourceSize.onActive = sourceActive
  unused.onActive = unusedActive
  const source = variableCluster({ default: sourceSize, extra: unused })
  const unusedTarget = variable('4px', { name: 'unused-target-size' })
  const unusedTargetActive = vi.fn()
  unusedTarget.onActive = unusedTargetActive
  resolveRules([[undefined, variableCluster({ default: targetSize, soft: unusedTarget }), source]])
  expect(unusedTargetActive).not.toHaveBeenCalled()
  expect(targetActive).toHaveBeenCalledOnce()
  expect(sourceActive).toHaveBeenCalledOnce()
  expect(unusedActive).not.toHaveBeenCalled()
})

test('Cluster 成员配对只展开一层，成员中的 Cluster 仍作为默认 Variable', () => {
  const targetMember = variableCluster({
    default: variable('1px', { name: 'nested-target-size' }),
    soft: variable('2px', { name: 'nested-target-soft-size' }),
  })
  const sourceMember = variableCluster({
    default: variable('10px', { name: 'nested-source-size' }),
    soft: variable('20px', { name: 'nested-source-soft-size' }),
  })
  expect(resolveRules([[undefined, variableCluster({ default: targetMember }), variableCluster({ default: sourceMember })]]))
    .toEqual([[[], '--nested-target-size', 'var(--nested-source-size, 10px)']])
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

// 显式 Rule 作用域与状态内容的求值上下文必须分开，不能生成隐式交集。
test('仅在两个状态内容中出现的依赖仍只生成常态与自身两项状态', () => {
  const inner = variable('10px', { name: 'state-inner-size', states: { hover: '20px', active: '30px' } })
  const outer = variable('1px', { name: 'state-outer-size', states: { hover: inner, active: inner } })
  const records = resolveRules([[[condition('.StateReference')], 'width', outer]])
  for (const key of ['--state-inner-size', '--state-outer-size']) {
    const declarations = records.filter(([, name]) => name === key)
    expect(declarations).toHaveLength(3)
    expect(declarations.every(([path]) => !(path.join(' ').includes(':hover') && path.join(' ').includes(':active')))).toBe(true)
  }
  expect(records.find(([path, key]) => key === '--state-inner-size' && path.length === 1)?.[2]).toBe('10px')
})

test('普通同名 Variable 对象各自的状态仍参与，未被自动定义缓存吞掉', () => {
  const first = variable('1px', { name: 'shared-state-size', states: { hover: '2px' } })
  const second = variable('3px', { name: 'shared-state-size', states: { active: '4px' } })
  const records = resolveRules([[[condition('.SharedState')], 'width', first], [[condition('.SharedState')], 'height', second]])
  expect(records.filter(([, key]) => key === '--shared-state-size').map(([, , text]) => text)).toEqual(['1px', '2px', '4px'])
})

test('五成员目标接收三成员来源时，只覆盖双方已有成员', () => {
  const target = variableCluster({
    default: variable('black', { name: 'partial-target-color' }),
    soft: variable('gray', { name: 'partial-target-soft-color' }),
    strong: variable('black', { name: 'partial-target-strong-color' }),
    foreground: variable('white', { name: 'partial-target-foreground-color' }),
    line: variable('silver', { name: 'partial-target-line-color' }),
  })
  const source = variableCluster({
    default: variable('blue', { name: 'partial-source-color' }),
    foreground: variable('white', { name: 'partial-source-foreground-color' }),
    line: variable('navy', { name: 'partial-source-line-color' }),
  })
  expect(resolveRules([[[condition('.Partial')], target, source]]).map(([, key]) => key))
    .toEqual(['--partial-target-color', '--partial-target-foreground-color', '--partial-target-line-color'])
  expect(target('soft').name).toBe('partial-target-soft-color')
  expect(target('strong').name).toBe('partial-target-strong-color')
})

test('显式 Variable 局部分支保留其消费状态，状态内容的临时条件不扩散', () => {
  const inner = variable('10px', { name: 'branch-inner-size', states: { hover: '20px', active: '30px' } })
  const target = variable(undefined, { name: 'branch-target-size' })
  const records = resolveRules([[[condition('.BranchScope')], target, [['active', inner]]]])
  const definitions = records.filter(([, key]) => key === '--branch-inner-size')
  expect(definitions).toHaveLength(1)
  expect(definitions[0][0].join(' ')).toContain(':active')
  expect(definitions[0][2]).toBe('30px')
})
