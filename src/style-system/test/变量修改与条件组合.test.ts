import { describe, expect, it } from 'vitest'
import { condition, createJSSContent, variable, value } from '../index'
import { compileRules } from '../css-root'
import type { Rules } from '../rule'

const button = condition('.button')
const hover = condition('&:hover')
const focus = condition('&:focus')
const add = (current: unknown, change: unknown) => createJSSContent((read) => `calc(${read(current)} + ${read(change)})`, [current, change])
const row = (path: (ReturnType<typeof condition> | string)[], pair: ReturnType<import('../variable').Variable['declare']>): Rules[number] => [path, ...pair]

describe('变量修改与条件组合', () => {
  it('首参数默认值不随局部定义或修改改变，注册初始值独立', () => {
    const n = variable(1, { name: 'stable-default', registration: { syntax: '<number>', inherits: true, initialValue: 9 }, modification: { apply: add } })
    const css = compileRules([row([button], n.declare(4)), row([button, hover], n.modify(3)), [[button], 'z-index', n]])
    expect(css).toContain('z-index: var(--stable-default, 1);')
    expect(css).toContain('--stable-default-modify-1-base: 4;')
    expect(css).toContain('initial-value: 9;')
    expect(css).toContain('calc(var(--stable-default-modify-1-step-1-input) + 3)')
  })
  it('两组件分别展开；重复编译不积累步骤', () => {
    const n = variable(1, { name: 'n', modification: { apply: add } })
    const panel = condition('.panel')
    const input: Rules = [row([button], n.declare()), row([button, hover], n.modify(3)), row([button, focus], n.modify(5)), row([panel], n.declare()), row([panel, focus], n.modify(10))]
    const css = compileRules(input)
    expect(css).toContain('calc(var(--n-modify-1-step-1-input) + 3)')
    expect(css).toContain('calc(var(--n-modify-1-step-2-input) + 5)')
    expect(css).toContain('calc(var(--n-modify-2-step-1-input) + 10)')
    expect(compileRules(input)).toBe(css)
  })
  it('状态写入基础值，普通引用先出现也不留下公共状态覆盖', () => {
    const n = variable(1, { name: 'n', states: { hover: 10 }, modification: { apply: add } })
    const css = compileRules([[ [button], 'z-index', n ], row([button], n.declare()), row([button, 'hover'], n.modify(3))])
    expect(css).toContain('--n-modify-1-base: 10')
    expect(css).not.toContain('--n: 10')
  })
  it('局部声明只清理自身自动产物，保留同名手写声明和另一实例产物', () => {
    const first = variable(1, { name: 'same-name', states: { hover: 10 } })
    const second = variable(2, { name: 'same-name', states: { hover: 20 } })
    const css = compileRules([
      [[button], 'z-index', first],
      [[condition('.panel')], 'z-index', second],
      [[button, focus], '--same-name', 77],
      row([button], first.declare(5)),
    ])
    expect(css.match(/--same-name: 10;/g)).toHaveLength(1)
    expect(css.match(/--same-name: 20;/g)).toHaveLength(1)
    expect(css).toContain('--same-name: 77;')
    expect(css).toContain('--same-name: 5;')
    expect(css).toContain('--same-name: 2;')
  })
  it('自动状态定义按目标路径归属嵌套的同一 Variable 声明', () => {
    const n = variable(1, { name: 'nested-target', states: { hover: 10, focus: 20 }, modification: { apply: add } })
    const css = compileRules([
      [[button], 'z-index', n],
      row([button], n.declare()),
      row([button, 'hover'], n.declare()),
      row([button, 'hover', 'focus'], n.modify(3)),
    ])
    expect(css).toContain('--nested-target-modify-2-base: 10')
    expect(css).toContain('calc(var(--nested-target-modify-2-step-1-input) + 3)')
  })
  it('没有局部声明时，普通引用仍用公开定义键生成状态', () => {
    const n = variable(1, { name: 'standalone-state', states: { hover: 10 } })
    const css = compileRules([[[button], 'z-index', n]])
    expect(css).toContain('--standalone-state: 10')
    expect(css).toContain('z-index: var(--standalone-state, 1)')
  })
  it('apply 的依赖带来的晚到修改参与同一条链', () => {
    const n = variable(1, { name: 'n', modification: { apply: (current, change) => change === 3 ? value(add(current, change), { onActive: () => [row([button, focus], n.modify(5))] }) : add(current, change) } })
    const css = compileRules([row([button], n.declare()), row([button, hover], n.modify(3))])
    expect(css).toContain('calc(var(--n-modify-1-step-2-input) + 5)')
  })
  it('同 ID 是同一步覆盖，无 ID 则独立；未修改定义不分裂', () => {
    const n = variable(1, { name: 'n', modification: { apply: add } })
    expect(compileRules([row([button], n.declare())])).not.toContain('modify-')
    const css = compileRules([row([button], n.declare()), row([button, hover], n.modify(3, { id: 'interaction' })), row([button, focus], n.modify(5, { id: 'interaction' }))])
    expect(css).not.toContain('step-2')
    expect(css).toContain('calc(var(--n-modify-1-step-1-input) + 5)')
  })
  it('原始状态父链决定最近定义，不使用排序后的状态顺序', () => {
    const n = variable(1, { name: 'n', modification: { apply: add } })
    const css = compileRules([row([button], n.declare()), row([button, 'hover'], n.declare()), row([button, 'hover', 'focus'], n.modify(3))])
    expect(css).toContain('calc(var(--n-modify-2-step-1-input) + 3)')
    expect(css).not.toContain('--n-modify-1-base')
  })
  it('缺失定义和缺失解释函数有明确诊断', () => {
    const n = variable(1, { name: 'n' })
    expect(() => compileRules([row([button], n.modify(3))])).toThrow('找不到父路径定义')
    expect(() => compileRules([row([button], n.declare()), row([button], n.modify(3))])).toThrow('modification.apply')
  })
})

it('按需产生的同址修改仍是两个独立贡献', () => {
  const n = variable(1, { name: 'late-independent', modification: { apply: add } })
  const dependency = value('trigger', { onActive: () => [row([button, focus], n.modify(2)), row([button, focus], n.modify(3))] })
  const css = compileRules([row([button], n.declare()), [[button], 'content', dependency]])
  expect(css).toContain('calc(var(--late-independent-modify-1-step-1-input) + 2)')
  expect(css).toContain('calc(var(--late-independent-modify-1-step-2-input) + 3)')
})

it('另一组晚到的最近定义重新接管修改，并撤销旧表达式的独占依赖', () => {
  const oldDependency = value('1', { onActive: () => [[[condition('.old-resource')], 'color', 'red']] })
  const n = variable(1, { name: 'rebound', modification: { apply: (current, change) => String(current).includes('-modify-1-') ? createJSSContent((read) => `calc(${read(current)} + ${read(oldDependency)})`, [current, oldDependency]) : add(current, change) } })
  const trigger = variable(0, { name: 'trigger', modification: { apply: (current, change) => value(add(current, change), { onActive: () => [row([button, hover], n.declare())] }) } })
  const css = compileRules([row([button], n.declare()), row([button, hover], n.modify(2)), row([button], trigger.declare()), row([button, focus], trigger.modify(1))])
  expect(css).not.toContain('.old-resource')
  expect(css).toContain('calc(var(--rebound-modify-3-step-1-input) + 2)')
})

it('撤销一个生成消费者仍保留另一个消费者使用的共享依赖', () => {
  const shared = value('1', { onActive: () => [[[condition('.shared-resource')], 'color', 'red']] })
  const n = variable(1, { name: 'rebound-shared', modification: { apply: (current, change) => String(current).includes('-modify-1-') ? createJSSContent((read) => `calc(${read(current)} + ${read(shared)})`, [current, shared]) : add(current, change) } })
  const trigger = variable(0, { name: 'trigger-shared', modification: { apply: (current, change) => value(add(current, change), { onActive: () => [row([button, hover], n.declare())] }) } })
  const css = compileRules([row([button], n.declare()), row([button, hover], n.modify(2)), row([button], trigger.declare()), row([button, focus], trigger.modify(1)), [[button], 'opacity', shared]])
  expect(css).toContain('.shared-resource')
  expect(css).toContain('calc(var(--rebound-shared-modify-3-step-1-input) + 2)')
})

it('显式定义保留默认基础值并激活 Variable 注册', () => {
  const n = variable(7, { name: 'registered', registration: { syntax: '<number>', inherits: false, initialValue: 1 }, modification: { apply: add } })
  const css = compileRules([row([button], n.declare()), row([button, hover], n.modify(2))])
  expect(css).toContain('@property --registered {')
  expect(css).toContain('--registered-modify-1-base: 7')
  expect(css).toContain('@property --registered-modify-1-step-1 {')
})

it('晚到消费者仍沿原始状态父链将状态路由到 base', () => {
  const n = variable(1, { name: 'late-state', states: { hover: 10, active: 20 }, modification: { apply: add } })
  const trigger = variable(0, { name: 'state-trigger', modification: { apply: (current, change) => value(add(current, change), { onActive: () => [[[button, 'hover', 'focus'], 'z-index', n]] }) } })
  const css = compileRules([row([button, 'hover'], n.declare()), row([button, 'hover', 'focus'], n.modify(3)), row([button], trigger.declare()), row([button, focus], trigger.modify(1))])
  expect(css).toContain('--late-state-modify-1-base: 20')
  expect(css).not.toContain('--late-state: 20')
})

it('定义由其他普通内容晚到时，当前修改只等待队列的实际进展', () => {
  const n = variable(1, { name: 'late-definition', modification: { apply: add } })
  const trigger = value('1', { onActive: () => [row([button], n.declare())] })
  const css = compileRules([row([button, hover], n.modify(2)), [[button], 'opacity', trigger]])
  expect(css).toContain('calc(var(--late-definition-modify-1-step-1-input) + 2)')
})

it('apply 返回递归内容由普通内容解析诊断，修改器不提前消费引用链', () => {
  const recursive: ReturnType<typeof createJSSContent> = createJSSContent(() => '1')
  recursive.contents = [recursive]
  const n = variable(1, { name: 'recursive-modification', modification: { apply: () => recursive } })
  expect(() => compileRules([row([button], n.declare()), row([button, hover], n.modify(2))])).toThrow('循环引用')
})

it('定义来源由真实 base 消费一次，不通过隐藏容器重复解析', () => {
  let reads = 0
  const source = variable(() => { reads++; return 1 }, { name: 'counted-source' })
  const n = variable(source, { name: 'single-consumer' })
  compileRules([row([button], n.declare())])
  expect(reads).toBe(1)
})

it('未进入 apply 返回内容的修改参数不激活依赖', () => {
  let activations = 0
  const unused = value(2, { onActive: () => { activations++; return [[[condition('.unused-change')], 'color', 'red']] } })
  const n = variable(1, { name: 'ignored-change', modification: { apply: current => current } })
  const css = compileRules([row([button], n.declare()), row([button, hover], n.modify(unused))])
  expect(activations).toBe(0)
  expect(css).not.toContain('.unused-change')
})

it('修改参数是不透明内容，由 apply 自行解释或忽略', () => {
  const payload = { amount: '3', unrelated: Symbol('payload') }
  let received: unknown
  const interpreted = variable(1, { name: 'opaque-change', modification: { apply: (current, change: typeof payload) => {
    received = change
    return add(current, Number(change.amount))
  } } })
  const ignored = variable(1, { name: 'ignored-shape', modification: { apply: (current, _change: number) => current } })
  const css = compileRules([
    row([button], interpreted.declare()), row([button], interpreted.modify(payload)),
    row([button], ignored.declare()), row([button], ignored.modify(payload)),
  ])
  expect(received).toBe(payload)
  expect(css).toContain('calc(var(--opaque-change-modify-1-step-1-input) + 3)')
  expect(css).toContain('--ignored-shape-modify-2-step-1: var(--ignored-shape-modify-2-step-1-input)')
})
