/** Variable 局部声明与修改条件的流程测试。
 *
 * 验证基础值、状态归属、修改连接与最终 CSS。
 *
 * 防止节点增删和条件组合后沿用错误的局部来源。
 */
import { describe, expect, it, vi } from 'vitest'
import { condition, createJSSContent, variable, value } from '../index'
import { compileRules } from '../css-root'
import type { Rules } from '../rule'
import { semanticPathParts } from '../condition'
import { appendStateCondition } from '../pieces/state-conditions'
import { rulesToStyleNodes } from '../compiler/rules-to-style-nodes'
import { styleNodesToContentNodes } from '../compiler/style-nodes-to-content-nodes'
import { contentNodesToCSSString } from '../compiler/content-nodes-to-css-string'
import * as astModule from '../compiler/ast-controller'
import type { JSSContent } from '../content'
import * as conditionModule from '../condition'

const button = condition('.button')
const hover = condition('&:hover')
const focus = condition('&:focus')
/** 生成读取前序值与修改量的 CSS 加法内容。 */
const add = (current: unknown, change: unknown) => createJSSContent((resolve) => `calc(${resolve(current)} + ${resolve(change)})`, [current, change])
/** 将声明配到指定条件路径，不改变声明对象。 */
const row = (path: (ReturnType<typeof condition> | string)[], pair: ReturnType<import('../variable').Variable['declare']>): Rules[number] => [path, ...pair]

it('局部声明缺少语义快照时，生成状态保留已有状态再接新状态', () => {
  const n = variable(1, { name: 'missing-semantic-state', states: { focus: 10 }, modification: { apply: add } })
  const input: Rules = [
    row([button, 'hover'], n.declare()),
    row([button, 'hover', 'focus'], n.modify(3)),
    [[], 'order', { compileWaveIndex: 1, onCompile(_, ast) {
      const generated = ast.search({}).find((node) => node.content === 10 && node.readState === 'focus')!
      expect(semanticPathParts(generated.conditionPath)).toEqual(semanticPathParts(expected))
      expect(generated.conditionPath.stateConditionPath.map((state) => state.name)).toEqual(['focus', 'hover'])
      return 1
    } }],
  ]
  const nodes = rulesToStyleNodes(input)
  delete nodes[0].conditionPath.semanticPath
  const expected = appendStateCondition(nodes[0].conditionPath, 'focus')
  const css = contentNodesToCSSString(styleNodesToContentNodes(nodes, input))
  expect(css).toContain('--missing-semantic-state-modify-1-base: 10;')
  expect(css).toContain('calc(var(--missing-semantic-state-modify-1-step-1-input) + 3)')
  expect(css).not.toContain('step-2')
  expect(compileRules(input)).toContain('--missing-semantic-state-modify-1-base: 10;')
})

describe('变量修改与条件组合', () => {
  it('普通值节点不会被误认为局部声明', () => {
    const n = variable(1, { name: 'primitive-neighbor', modification: { apply: add } })
    const css = compileRules([[[button], 'width', '1px'], row([button], n.declare(4)), row([button, hover], n.modify(3))])
    expect(css).toContain('width: 1px;')
    expect(css).toContain('calc(var(--primitive-neighbor-modify-1-step-1-input) + 3)')
  })
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
  const n = variable(1, { name: 'rebound', modification: { apply: (current, change) => String(current).includes('-modify-1-') ? createJSSContent((resolve) => `calc(${resolve(current)} + ${resolve(oldDependency)})`, [current, oldDependency]) : add(current, change) } })
  const trigger = variable(0, { name: 'trigger', modification: { apply: (current, change) => value(add(current, change), { onActive: () => [row([button, hover], n.declare())] }) } })
  const css = compileRules([row([button], n.declare()), row([button, hover], n.modify(2)), row([button], trigger.declare()), row([button, focus], trigger.modify(1))])
  expect(css).not.toContain('.old-resource')
  expect(css).toContain('calc(var(--rebound-modify-3-step-1-input) + 2)')
})

it('撤销一个生成消费者仍保留另一个消费者使用的共享依赖', () => {
  const shared = value('1', { onActive: () => [[[condition('.shared-resource')], 'color', 'red']] })
  const n = variable(1, { name: 'rebound-shared', modification: { apply: (current, change) => String(current).includes('-modify-1-') ? createJSSContent((resolve) => `calc(${resolve(current)} + ${resolve(shared)})`, [current, shared]) : add(current, change) } })
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

it.each([undefined, 9])('普通注册与修改内部注册共享同一字段内容，initialValue=%s', (initialValue) => {
  const n = variable(7, { name: 'shared-registration-content', registration: { syntax: '<number>', inherits: false, initialValue }, modification: { apply: add } })
  const css = compileRules([row([button], n.declare()), row([button, 'hover'], n.modify(2))])
  const registrations = [...css.matchAll(/@property (--shared-registration-content[^ ]*) \{\n([^}]+)\}/g)]
  expect(registrations.map(([, name]) => name)).toEqual([
    '--shared-registration-content', '--shared-registration-content-modify-1-base', '--shared-registration-content-modify-1-step-1',
  ])
  const expected = `syntax: "<number>";\ninherits: false;\n${initialValue === undefined ? '' : 'initial-value: 9;\n'}`
  for (const [, , body] of registrations) expect(body).toBe(expected)
  expect(css).not.toContain('undefined')
})

it('一次修改操作复用候选，业务 apply 返回后重新取得当前队列', () => {
  const n = variable(1, { name: 'operation-candidates', modification: { apply: add } })
  const definitionKey = n.config.definitionKey
  Object.defineProperty(n.config, 'definitionKey', { get: () => definitionKey })
  const create = astModule.createASTController
  let queries = 0
  const factory = vi.spyOn(astModule, 'createASTController').mockImplementation((session) => {
    const controller = create(session)
    const search = controller.search
    controller.search = (query) => { if (query.key === definitionKey) queries++; return search(query) }
    return controller
  })
  try {
    const css = compileRules([row([button], n.declare()), row([button], n.modify(2)), row([button], n.modify(3)), row([button], n.modify(4))])
    expect(css).toContain('--operation-candidates-modify-1-step-3-input: var(--operation-candidates-modify-1-step-2);')
    expect(queries).toBe(7)
  } finally { factory.mockRestore() }
})

it('apply 回调移动共享成员时，返回后用新候选重选锚点与连接', () => {
  let controller: astModule.ASTController
  const n = variable(1, { name: 'apply-moved-anchor', modification: { apply(current, change) {
    if (change === 4) {
      const nodes = controller.search({ key: n.config.definitionKey })
      controller.move(nodes.find((node) => node.content === sharedFirst[1])!, { after: nodes.find((node) => node.content === sharedNext[1])! })
    }
    return add(current, change)
  } } })
  const sharedFirst = n.modify(2, { id: 'shared' })
  const middle = n.modify(3)
  const sharedNext = n.modify(4, { id: 'shared' })
  const css = compileRules([
    [[], 'order', { onCompile(_, ast) { controller = ast; return 1 } }],
    row([button], n.declare()), row([button, 'hover'], sharedFirst), row([button], middle), row([button, 'focus'], sharedNext),
  ])
  expect(css).toContain('--apply-moved-anchor-modify-1-step-2-input: var(--apply-moved-anchor-modify-1-base);')
  expect(css).toContain('--apply-moved-anchor-modify-1-step-1-input: var(--apply-moved-anchor-modify-1-step-2);')
  expect(css).toContain('--apply-moved-anchor: var(--apply-moved-anchor-modify-1-step-1);')
})

it('apply 回调读取新步骤时已经连接前序，返回后最终连接仍保持', () => {
  let controller: astModule.ASTController
  let observed: unknown
  const n = variable(1, { name: 'apply-visible-chain', modification: { apply(current, change) {
    if (change === 3) observed = controller.search({ key: '--apply-visible-chain-modify-1-step-2-input' })[0].content
    return add(current, change)
  } } })
  const css = compileRules([
    [[], 'order', { onCompile(_, ast) { controller = ast; return 1 } }],
    row([button], n.declare()), row([button], n.modify(2)), row([button], n.modify(3)),
  ])
  expect(observed).toBe('var(--apply-visible-chain-modify-1-step-1)')
  expect(css).toContain('--apply-visible-chain-modify-1-step-2-input: var(--apply-visible-chain-modify-1-step-1);')
  expect(css).toContain('--apply-visible-chain: var(--apply-visible-chain-modify-1-step-2);')
})

it('局部基础生产函数改写定义路径后，归属判断使用新路径深度', () => {
  let controller: astModule.ASTController
  const n = variable(1, { name: 'source-boundary', modification: { apply: add } })
  const local = n.declare(2)
  n.config.defaultValue = () => {
    const nodes = controller.search({ key: n.config.definitionKey })
    nodes.find((node) => node.content === late[1])!.conditionPath = appendStateCondition(nodes.find((node) => node.content === local[1])!.conditionPath, 'focus')
    return 10
  }
  const late = n.declare()
  Object.assign(late[1] as JSSContent, { compileWaveIndex: 1 })
  const css = compileRules([
    [[], 'order', { onCompile(_, ast) { controller = ast; return 1 } }],
    row([button], n.declare(1)), row([button, 'hover'], local), row([button, 'hover', 'focus'], n.modify(3)), row([button, 'focus'], late),
  ])
  expect(css).toContain('--source-boundary-modify-3-base: 10;')
  expect(css).toContain('calc(var(--source-boundary-modify-3-step-1-input) + 3)')
  expect(css).not.toContain('--source-boundary-modify-2-step-1')
})

it('晚到定义接管同路径多步时，当前操作复用最近归属判断', () => {
  let measuring = false
  let checks = 0
  const prefix = conditionModule.isSemanticPathPrefix
  const matching = vi.spyOn(conditionModule, 'isSemanticPathPrefix').mockImplementation((parent, child) => {
    if (measuring) checks++
    return prefix(parent, child)
  })
  const n = variable(1, { name: 'reused-semantic-owner', modification: { apply: add } })
  n.config.defaultValue = () => { measuring = true; return 10 }
  const late = n.declare()
  try {
    const css = compileRules([
      row([button], n.declare(1)),
      row([button, 'hover'], n.modify(2)), row([button, 'hover'], n.modify(3)), row([button, 'hover'], n.modify(4)),
      [[button, 'hover'], 'opacity', { compileWaveIndex: 1, onCompile(context, ast) {
        ast.insert({ before: context.node, conditionPath: context.conditionPath }, late, { owner: context.node })
        return 1
      } }],
      [[], 'order', { compileWaveIndex: 2, onCompile() { measuring = false; expect(checks).toBe(2); return 1 } }],
    ])
    expect(css).toContain('--reused-semantic-owner-modify-2-base: 10;')
    expect(css).toContain('--reused-semantic-owner-modify-2-step-3-input: var(--reused-semantic-owner-modify-2-step-2);')
  } finally { matching.mockRestore() }
})

it('已编译的中间步骤移动并显式重访后重新连接，不重复生成 apply', () => {
  let applies = 0
  const n = variable(1, { name: 'moved-middle-step', modification: { apply(current, change) { applies++; return add(current, change) } } })
  const first = n.modify(2)
  const middle = n.modify(3)
  const last = n.modify(4)
  const css = compileRules([
    row([button], n.declare()), row([button], first), row([button], middle), row([button], last),
    [[button], 'order', { compileWaveIndex: 2, onCompile(_, ast) {
      const candidates = ast.search({ key: n.config.definitionKey })
      const moved = candidates.find((node) => node.content === middle[1])!
      ast.move(moved, { after: candidates.find((node) => node.content === last[1])! })
      moved.compileRevision++
      return 1
    } }],
  ])
  expect(applies).toBe(3)
  expect(css).toContain('--moved-middle-step-modify-1-step-3-input: var(--moved-middle-step-modify-1-step-1);')
  expect(css).toContain('--moved-middle-step-modify-1-step-2-input: var(--moved-middle-step-modify-1-step-3);')
  expect(css).toContain('--moved-middle-step: var(--moved-middle-step-modify-1-step-2);')
})

it('共享步骤移动后重新选择最早成员，撤销该成员再按当前候选连接', () => {
  let applies = 0
  const n = variable(1, { name: 'moved-shared-step', modification: { apply(current, change) { applies++; return add(current, change) } } })
  const first = n.modify(2)
  const sharedFirst = n.modify(3, { id: 'shared' })
  const middle = n.modify(4)
  const sharedNext = n.modify(5, { id: 'shared' })
  const css = compileRules([
    row([button], n.declare()), row([button], first), row([button, 'hover'], sharedFirst), row([button], middle), row([button, 'focus'], sharedNext),
    [[button], 'order', { compileWaveIndex: 2, onCompile(_, ast) {
      const nodes = ast.search({ key: n.config.definitionKey })
      const moved = nodes.find((node) => node.content === sharedFirst[1])!
      ast.move(moved, { after: nodes.find((node) => node.content === sharedNext[1])! })
      moved.compileRevision++
      return 1
    } }],
    [[button], 'opacity', { compileWaveIndex: 3, onCompile(_, ast) {
      ast.remove(ast.search({ key: n.config.definitionKey }).find((node) => node.content === sharedNext[1])!)
      return 1
    } }],
  ])
  expect(applies).toBe(4)
  expect(css).toContain('--moved-shared-step-modify-1-step-3-input: var(--moved-shared-step-modify-1-step-1);')
  expect(css).toContain('--moved-shared-step-modify-1-step-2-input: var(--moved-shared-step-modify-1-step-3);')
  expect(css).toContain('--moved-shared-step: var(--moved-shared-step-modify-1-step-2);')
  expect(css).not.toContain(' + 5)')
  expect(css).toContain(' + 3)')
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

it('apply 返回递归内容由普通内容编译诊断，修改器不提前消费引用链', () => {
  const recursive: ReturnType<typeof createJSSContent> = createJSSContent(() => '1')
  recursive.dependencies = [recursive]
  const n = variable(1, { name: 'recursive-modification', modification: { apply: () => recursive } })
  expect(() => compileRules([row([button], n.declare()), row([button, hover], n.modify(2))])).toThrow('循环引用')
})

it('定义来源由真实 base 消费一次，不通过隐藏容器重复编译', () => {
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
