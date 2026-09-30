/** 稳定组合不会传播 Variable 的状态。 */
import { expect, test, vi } from 'vitest'
import { result } from '@edsolater/fnkit'
import { condition } from '../condition'
import { createJSSContent } from '../content'
import { value } from '../value'
import { variable } from '../variable'
import { clusterDeclarations, clusterFrom, variableCluster } from '../variable-cluster'
import { colorMix } from '../pieces/contents/combiners/color-mix'
import { calcMultiply } from '../pieces/contents/combiners/calc'
import { compileRules } from '../css-root'
import { cssFunction } from '../pieces/contents/combiners/custom'
import { stateCondition } from '../pieces/state-conditions'
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

test('状态内容读取来源同状态内容，不生成来源独立定义或隐式交集', () => {
  const inner = variable('10px', { name: 'state-inner-size', states: { hover: '20px', active: '30px' } })
  const outer = variable('1px', { name: 'state-outer-size', states: { hover: inner, active: inner } })
  const css = compileRules([[[condition('.StateReference')], 'width', outer]])
  expect(css).not.toContain('--state-inner-size:')
  expect(css.match(/--state-outer-size:/g)).toHaveLength(3)
  expect(css).toContain('--state-outer-size: 1px;')
  expect(css).toContain('--state-outer-size: 20px;')
  expect(css).toContain('--state-outer-size: 30px;')
})

test('命中来源同名状态时不执行未消费的默认值，普通引用仍读取一次', () => {
  const createDefault = vi.fn(() => '10px')
  const source = variable(createDefault, { name: 'lazy-source-size', states: { hover: '20px' } })
  const target = variable('1px', { name: 'lazy-target-size', states: { hover: source } })

  const nested = compileRules([[[condition('.Nested')], 'width', target]])
  expect(nested).toContain('--lazy-target-size: 20px;')
  expect(nested).not.toContain('--lazy-source-size:')
  expect(createDefault).not.toHaveBeenCalled()

  const direct = compileRules([[[condition('.Direct')], 'width', source]])
  expect(direct).toContain('width: var(--lazy-source-size, 10px);')
  expect(createDefault).toHaveBeenCalledTimes(1)
})

test('外层 active 不改变 hover 内容沿多层来源读取的状态', () => {
  const palette = variable('gray', { name: 'chain-palette-color', states: { hover: 'blue', active: 'red' } })
  const nested = variable('silver', { name: 'chain-nested-color', states: { hover: palette } })
  const fallback = variable('black', { name: 'chain-fallback-color', states: { active: 'orange' } })
  const surface = variable('white', {
    name: 'chain-surface-color',
    states: { hover: colorMix(nested, fallback) },
  })
  const css = compileRules([[[condition('.Chain'), 'active'], 'background-color', surface]])
  expect(css.match(/--chain-surface-color:/g)).toHaveLength(2)
  expect(css).toContain('--chain-surface-color: color-mix(in oklab, blue, black);')
  expect(css).not.toContain('--chain-palette-color:')
  expect(css).not.toContain('--chain-nested-color:')
  expect(css).not.toContain('--chain-fallback-color:')
  expect(css).not.toContain('red')
  expect(css).not.toContain('orange')
})

test('仅被状态内容内联的来源不输出未被 CSS 引用的注册', () => {
  const palette = variable('gray', {
    name: 'inline-palette-color',
    states: { hover: 'blue', active: 'red' },
    registration: { syntax: '<color>', inherits: true, initialValue: 'gray' },
  })
  const surface = variable('white', { name: 'inline-surface-color', states: { hover: palette } })
  const css = compileRules([[[condition('.InlinePalette')], 'background-color', surface]])
  expect(css).toContain('--inline-surface-color: blue;')
  expect(css).not.toContain('@property --inline-palette-color')
  expect(css).not.toContain('--inline-palette-color:')
  const direct = compileRules([[[condition('.DirectPalette')], 'color', palette]])
  expect(direct).toContain('@property --inline-palette-color')
  expect(direct).toContain('color: var(--inline-palette-color, gray);')
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
test('内部声明 Key 在使用时按当前变量名生成，自动状态仍归于当前名称', () => {
  const target = variable('1px', { name: 'before-size', states: { hover: '2px' } })
  const firstKey = target.config.definitionKey
  target.name = 'after-size'
  const nextKey = target.config.definitionKey

  expect(nextKey).not.toBe(firstKey)
  expect(nextKey.toCSSString()).toBe('--after-size')
  const css = compileRules([[[condition('.Renamed')], 'width', target]])
  expect(css).toContain('width: var(--after-size, 1px);')
  expect(css).toContain('--after-size: 1px;')
  expect(css).toContain('--after-size: 2px;')
  expect(css).not.toContain('--before-size')
})
test('Cluster 多层成员继承保持来源引用、自身覆盖和未定义状态', () => {
  const source = variable('red', { name: 'source-color', states: { hover: 'pink', active: 'blue', disabled: 'gray' } })
  const sourceCluster = variableCluster({ default: source, soft: variable('orange', { name: 'source-soft-color', states: { hover: 'yellow' } }) })
  const derived = clusterFrom(sourceCluster, {
    default: { name: 'derived-color', states: { active: source => colorMix(source, 'white') } },
    soft: { name: 'derived-soft-color' },
  })
  const final = clusterFrom(derived, { default: { name: 'final-color', states: { hover: 'green' } } })
  const css = compileRules([[[condition('.Example')], 'color', final], [[condition('.Soft')], 'color', derived('soft')]])
  expect(css).toContain('--derived-color: color-mix(in oklab, blue, white);')
  expect(css).toContain('--final-color: green;')
  expect(css).toContain('var(--derived-color')
  expect(css).toContain('--derived-soft-color: var(--source-soft-color, orange);')
  expect(css).toContain('--source-soft-color: yellow;')
  expect(final('soft')).toBe(derived('soft'))
  expect(compileRules([[[condition('.Source')], 'color', source]])).not.toContain('--final-color:')
})

test('Cluster 继承保留未改成员，也能加入新成员且未用成员不激活', () => {
  const unusedActive = vi.fn()
  const source = variableCluster({
    default: variable('red', { name: 'family-source-color', states: { hover: 'blue' } }),
    soft: variable('pink', { name: 'family-source-soft-color', onActive: unusedActive }),
  })
  const extra = variable('white', { name: 'family-extra-color' })
  const family = clusterFrom(source, {
    default: { name: 'family-color' },
    extra,
  })
  expect(family('soft')).toBe(source('soft'))
  expect(family('extra')).toBe(extra)
  const css = compileRules([[[condition('.Family')], 'color', family]])
  expect(css).toContain('--family-color: var(--family-source-color, red);')
  expect(css).toContain('--family-source-color: blue;')
  expect(css).not.toContain('--family-source-soft-color:')
  expect(css).not.toContain('--family-extra-color:')
  expect(unusedActive).not.toHaveBeenCalled()
})
test('Cluster 直接使用等同默认成员，选择返回原对象并保留状态', () => {
  const normal = variable('red', { name: 'normal-color' })
  const soft = variable('pink', { name: 'soft-color', states: { active: 'purple' } })
  const cluster = variableCluster({ default: normal, soft })
  expect(cluster('soft')).toBe(soft)
  expect(result(cluster)).toBe(cluster)
  const css = compileRules([[[condition('.Example')], 'color', cluster], [[condition('.Soft')], 'color', cluster('soft')]])
  expect(css).toContain('color: var(--normal-color, red);')
  expect(css).toContain('--soft-color: purple;')
  expect(() => (cluster as (name: string) => unknown)('missing')).toThrow('未定义成员')
})

test('未登记的原始值或普通函数没有 Cluster 成员', () => {
  const cluster = variableCluster({ default: variable('red', { name: 'registered-cluster' }) })
  expect(clusterDeclarations(cluster, 'red')).toBeUndefined()
  expect(clusterDeclarations(1, cluster)).toBeUndefined()
  expect(clusterDeclarations(cluster, () => 'red')).toBeUndefined()
})

test('状态直接使用 Cluster 时保留其身份，普通状态工厂仍收到原始默认值', () => {
  const cluster = variableCluster({ default: variable('blue', { name: 'state-cluster-source' }) })
  const factory = vi.fn((defaultValue: string) => defaultValue + 'px')
  const target = variable('2', {
    name: 'state-cluster-target',
    states: { hover: cluster, active: factory },
  })

  expect(target.config.states.get('hover')).toBe(cluster)
  expect(target.config.states.get('active')).toBe('2px')
  expect(factory).toHaveBeenCalledExactlyOnceWith('2')
  const css = compileRules([[[condition('.StateCluster')], 'width', target]])
  expect(css).toContain('--state-cluster-target: blue;')
  expect(css).toContain('--state-cluster-target: 2px;')
})

test('Variable 与 Cluster 的 onActive 由通用遍历各自调用一次', () => {
  const directActive = vi.fn((): Rules => [[[condition(':root')], '--direct-active', '1']])
  const direct = variable('red', { name: 'generic-active-variable', onActive: directActive })
  const defaultActive = vi.fn((): Rules => [[[condition(':root')], '--cluster-active', '1']])
  const defaultMember = variable('blue', { name: 'generic-active-cluster', onActive: defaultActive })
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
  const unusedActive = vi.fn()
  const unused = variable('3px', { name: 'unused-source-size', onActive: unusedActive })
  const source = variableCluster({ default: sourceSize, extra: unused })
  const unusedTargetActive = vi.fn()
  const unusedTarget = variable('4px', { name: 'unused-target-size', onActive: unusedTargetActive })
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
  expect(css).toContain('--red-color: pink;')
  expect(css).toContain('--red-color: color-mix(in oklab, pink, white);')
})
test('零值不会沿来源链退回', () => {
  const source = variable(1, { name: 'source-opacity', states: { disabled: 0.5 } })
  const next = variable(source, { name: 'next-opacity', states: { disabled: 0 } })
  expect(compileRules([[[condition('.Example')], 'opacity', next]])).toContain('--next-opacity: 0;')
})

test('已在 active Rule 内消费时，首次自动声明采用 active 内容', () => {
  const source = variable('red', { name: 'active-color', states: { active: 'blue' } })
  const css = compileRules([[[condition('.Example'), 'active'], 'color', source]])
  expect(css).toContain('--active-color: blue;')
  expect(css).not.toContain('--active-color: red;')
})

test('延伸的注册使用新名字，来源默认值继续按需读取', () => {
  const source = variable('blue', { name: 'registered-source-color' })
  const next = variable(source, { name: 'registered-next-color', registration: { syntax: '<color>', inherits: true, initialValue: 'black' } })
  const css = compileRules([[[condition('.Example')], 'color', next]])
  expect(css).toContain('@property --registered-next-color')
  expect(css).toContain('var(--registered-source-color, blue)')
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
