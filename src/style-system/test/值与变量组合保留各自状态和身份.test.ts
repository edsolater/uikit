/** 稳定组合不会传播 Variable 的状态。 */
import { expect, test, vi } from 'vitest'
import { condition } from '../condition'
import { createJSSContent } from '../content'
import { value } from '../value'
import { variable, variableFrom } from '../variable'
import { variableCluster } from '../variable-cluster'
import { colorMix } from '../materials/tools/functions/color-mix'
import { calcMultiply } from '../materials/tools/functions/calc'
import { compileRules } from '../css-root'
import { cssFunction } from '../materials/tools/functions/custom'
import { stateCondition } from '../materials/state-conditions'
import { media } from '../condition'
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

test('仅由状态内容引用的变量，不生成两个状态的隐式交集', () => {
  const inner = variable('10px', { name: 'state-inner-size', states: { hover: '20px', active: '30px' } })
  const outer = variable('1px', { name: 'state-outer-size', states: { hover: inner, active: inner } })
  const css = compileRules([[[condition('.StateReference')], 'width', outer]])
  expect(css.match(/--state-inner-size:/g)).toHaveLength(3)
  expect(css.match(/--state-outer-size:/g)).toHaveLength(3)
  expect(css).toContain('--state-inner-size: 10px;')
  expect(css).toContain('--state-inner-size: 20px;')
  expect(css).toContain('--state-inner-size: 30px;')
})

test('函数的局部 Variable 与 result 留在同一份函数定义', () => {
  const size = variable('16px', { name: 'function-size', states: { functionMedia: '20px' } })
  const content = cssFunction('--measured-size() returns <length>', [[undefined, 'result', size]])()
  const css = compileRules([[[condition('.Example')], 'font-size', content]])
  expect(css.match(/@function --measured-size/g)).toHaveLength(1)
  expect(css).toContain('--function-size: 20px;')
  expect(css).toContain('result: var(--function-size, 16px);')
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
  const shared = value(variable('2px', { name: 'shared-position-size', states: { hover: '4px' } }))
  const rules: Rules = [
    [[condition('.AuditA')], 'width', shared],
    [[condition('.AuditB')], 'width', shared],
  ]
  const compileAndCheck = () => {
    const css = compileRules(rules)
    expect(css).toMatch(/\.AuditA[\s\S]*--shared-position-size:\s*2px;/)
    expect(css).toMatch(/\.AuditA[\s\S]*--shared-position-size:\s*4px;/)
    expect(css).toMatch(/\.AuditB[\s\S]*--shared-position-size:\s*2px;/)
    expect(css).toMatch(/\.AuditB[\s\S]*--shared-position-size:\s*4px;/)
  }

  compileAndCheck()
  expect(shared.content).toMatchObject({ kind: 'variable', name: 'shared-position-size' })
  compileAndCheck()
  expect(shared.content).toMatchObject({ kind: 'variable', name: 'shared-position-size' })
})
test('延伸保持来源引用，自身覆盖和未定义状态都声明到新名字', () => {
  const source = variable('red', { name: 'source-color', states: { hover: 'pink', active: 'blue', disabled: 'gray' } })
  const derived = variableFrom(source, { name: 'derived-color', states: { active: source => colorMix(source, 'white') } })
  const final = variableFrom(derived, { name: 'final-color', states: { hover: 'green' } })
  const css = compileRules([[[condition('.Example')], 'color', final]])
  expect(css).toContain('--derived-color: color-mix(in oklab, var(--source-color, red), white);')
  expect(css).toContain('--final-color: green;')
  expect(css).toContain('var(--derived-color')
  expect(compileRules([[[condition('.Source')], 'color', source]])).not.toContain('--final-color:')
})
test('Cluster 直接使用等同默认成员，选择返回原对象并保留状态', () => {
  const normal = variable('red', { name: 'normal-color' })
  const soft = variable('pink', { name: 'soft-color', states: { active: 'purple' } })
  const cluster = variableCluster({ default: normal, soft })
  expect(cluster('soft')).toBe(soft)
  const css = compileRules([[[condition('.Example')], 'color', cluster], [[condition('.Soft')], 'color', cluster('soft')]])
  expect(css).toContain('color: var(--normal-color, red);')
  expect(css).toContain('--soft-color: purple;')
  expect(() => (cluster as (name: string) => unknown)('missing')).toThrow('未定义成员')
})

test('Variable 与 Cluster 的 onActive 由通用遍历各自调用一次', () => {
  const directActive = vi.fn((): Rules => [[[condition(':root')], '--direct-active', '1']])
  const direct = variable('red', { name: 'generic-active-variable' })
  direct.onActive = directActive
  const defaultActive = vi.fn((): Rules => [[[condition(':root')], '--cluster-active', '1']])
  const defaultMember = variable('blue', { name: 'generic-active-cluster' })
  defaultMember.onActive = defaultActive
  const cluster = variableCluster({ default: defaultMember })

  const css = compileRules([
    [[condition('.GenericActivation')], 'color', direct],
    [[condition('.GenericActivation')], 'background', cluster],
  ])

  expect(directActive).toHaveBeenCalledTimes(1)
  expect(defaultActive).toHaveBeenCalledTimes(1)
  expect(css).toContain('--direct-active: 1;')
  expect(css).toContain('--cluster-active: 1;')
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
  const css = compileRules([[[condition('.Cluster')], target, source]])
  expect(css).toContain('--target-color: var(--source-color, red);')
  expect(css).toContain('--target-soft-color: var(--source-soft-color, pink);')
  expect(css).toContain('--target-strong-color: var(--source-strong-color, maroon);')
  expect(css).toContain('--target-foreground-color: var(--source-foreground-color, yellow);')
  expect(css).not.toContain('--source-line-color:')
  const plain = variable(undefined, { name: 'plain-color' })
  expect(compileRules([[[condition('.Plain')], plain, source]]))
    .toContain('--plain-color: var(--source-color, red);')
})

test('Cluster 忽略未匹配成员，只拒绝已匹配目标别名的不同来源', () => {
  const shared = variable('1px', { name: 'alias-size' })
  const target = variableCluster({ default: shared, 0: shared })
  const first = variable('2px', { name: 'first-size' })
  const second = variable('3px', { name: 'second-size' })
  expect(compileRules([[undefined, target, variableCluster({ default: first })]]))
    .toContain('--alias-size: var(--first-size, 2px);')
  expect(() => compileRules([[undefined, target, variableCluster({ default: first, 0: second })]]))
    .toThrow('同名目标存在对象或来源冲突')
  const sameName = variableCluster({ default: shared, 0: variable('9px', { name: shared.name }) })
  expect(() => compileRules([[undefined, sameName, variableCluster({ default: first, 0: second })]]))
    .toThrow('同名目标存在对象或来源冲突')
  expect(() => compileRules([[undefined, sameName, variableCluster({ default: first, 0: first })]]))
    .toThrow('同名目标存在对象或来源冲突')
  expect(compileRules([[undefined, target, variableCluster({ default: first, 0: first })]]))
    .toContain('--alias-size: var(--first-size, 2px);')
})

test('Cluster 自身成员赋值不产生 CSS 自循环，不同对象同名引用明确报错', () => {
  const size = variable('1px', { name: 'self-size' })
  const target = variableCluster({ default: size })
  expect(compileRules([[undefined, target, target]])).toBe('')
  expect(() => compileRules([[undefined, target, variableCluster({ default: variable('2px', { name: size.name }) })]]))
    .toThrow('不同对象引用同名变量 --self-size')
})

test('Cluster 只激活双方同名成员，未匹配的目标与来源均不激活', () => {
  const targetSize = variable('1px', { name: 'activated-target-size' })
  const sourceSize = variable('2px', { name: 'activated-source-size' })
  const unused = variable('3px', { name: 'unused-source-size' })
  const unusedActive = vi.fn()
  unused.onActive = unusedActive
  const source = variableCluster({ default: sourceSize, extra: unused })
  const unusedTarget = variable('4px', { name: 'unused-target-size' })
  const unusedTargetActive = vi.fn()
  unusedTarget.onActive = unusedTargetActive
  const css = compileRules([[undefined, variableCluster({ default: targetSize, soft: unusedTarget }), source]])
  expect(css).toContain('--activated-target-size: var(--activated-source-size, 2px);')
  expect(css).not.toContain('--unused-target-size:')
  expect(css).not.toContain('--unused-source-size:')
  expect(unusedTargetActive).not.toHaveBeenCalled()
  expect(unusedActive).not.toHaveBeenCalled()
})
test('状态直接接收 Cluster 和混色对象，不当成 source 回调', () => {
  const cluster = variableCluster({ default: variable('pink', { name: 'pink-color' }) })
  const source = variable('red', { name: 'red-color', states: { hover: cluster, active: colorMix(cluster, 'white') } })
  const css = compileRules([[[condition('.Example')], 'color', source]])
  expect(css).toContain('--red-color: var(--pink-color, pink);')
  expect(css).toContain('--red-color: color-mix(in oklab, var(--pink-color, pink), white);')
})
test('零值不会沿来源链退回', () => {
  const source = variable(1, { name: 'source-opacity', states: { disabled: 0.5 } })
  const next = variableFrom(source, { name: 'next-opacity', states: { disabled: 0 } })
  expect(compileRules([[[condition('.Example')], 'opacity', next]])).toContain('--next-opacity: 0;')
})

test('已在 active Rule 内消费时，首次自动声明采用 active 内容', () => {
  const source = variable('red', { name: 'active-color', states: { active: 'blue' } })
  const css = compileRules([[[condition('.Example'), 'active'], 'color', source]])
  expect(css).toContain('--active-color: blue;')
  expect(css).not.toContain('--active-color: red;')
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
  expect(compileRules([[[condition('.Shared')], 'color', colorMix(shared, shared)]]))
    .toContain('color: color-mix(in oklab, red, red);')
  const cycle = value(undefined)
  cycle.content = cycle
  expect(() => compileRules([[[condition('.Cycle')], 'color', cycle]])).toThrow('循环引用')
})
test('动态内容没有被消费时不执行，消费时产生 CSS', () => {
  const serialize = vi.fn(() => 'blue')
  const source = variable(createJSSContent(serialize), { name: 'deferred-color' })
  expect(serialize).not.toHaveBeenCalled()
  expect(compileRules([[[condition('.Example')], 'color', source]])).toContain('color: var(--deferred-color, blue);')
  expect(serialize).toHaveBeenCalled()
})
test('声明来源 Variable 不修改其定义，局部显式声明优先', () => {
  const ratio = variable(0.8, { name: 'surface-ratio', states: { hover: 0.6 } })
  const css = compileRules([[[condition('.Example'), 'hover'], ratio, 0.3], [[condition('.Example')], 'opacity', calcMultiply(ratio, 0.5)]])
  expect(css).toContain('--surface-ratio: 0.3;')
  expect(css).not.toContain('--surface-ratio: 0.6;')
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
  const css = compileRules([[[condition('.Partial')], target, source]])
  expect(css).toContain('--partial-target-color: var(--partial-source-color, blue);')
  expect(css).toContain('--partial-target-foreground-color: var(--partial-source-foreground-color, white);')
  expect(css).toContain('--partial-target-line-color: var(--partial-source-line-color, navy);')
  expect(css).not.toContain('--partial-target-soft-color:')
  expect(css).not.toContain('--partial-target-strong-color:')
})

test('显式 Variable 局部分支保留其消费状态，状态内容的临时条件不扩散', () => {
  const inner = variable('10px', { name: 'branch-inner-size', states: { hover: '20px', active: '30px' } })
  const target = variable(undefined, { name: 'branch-target-size' })
  const css = compileRules([[[condition('.BranchScope'), 'active'], target, inner]])
  expect(css).toContain('--branch-inner-size: 30px;')
  expect(css).not.toContain('--branch-inner-size: 20px;')
})
