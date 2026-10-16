/** 来源：用户要求按 CSS 名称激活依赖链、按声明键 priority 与书写顺序选择结果；协调止于本次 AST。 */
import { describe, expect, test } from 'vitest'
import { parse, type AnyNode } from 'postcss'
import { compileRules } from '../css-root'
import { createJSSContent, type JSSContent } from '../content'
import { declare } from '../declaration'
import { key } from '../key'
import { multiply } from '../pieces/contents/functions/calc'
import { appendStateCondition, resolveStateConditions } from '../pieces/state-conditions'
import type { Rules } from '../rule'
import { variable, type Variable } from '../variable'
import { variableCluster } from '../variable-cluster'
import { value } from '../value'

/**
 * 按完整 CSS 块读取声明，不依赖输出换行，也不模拟优先级选择。
 */
function declarationsAt(css: string, path: string[]): string[] {
  const lines: string[] = []
  parse(css).walkDecls(declaration => {
    const headers: string[] = []
    for (let parent: AnyNode | undefined = declaration.parent; parent; parent = parent.parent) {
      if (parent.type === 'rule') headers.unshift(parent.selector)
      if (parent.type === 'atrule') headers.unshift(`@${parent.name} ${parent.params}`.trim())
    }
    if (headers.length === path.length && headers.every((header, index) => header === path[index]))
      lines.push(`${declaration.prop}: ${declaration.value.replace(/\s*([,*+()])\s*/g, '$1')};`)
  })
  return lines
}

/**
 * 通过现役 AST 编辑接口把直接声明放到真正的 StateCondition 地址，不伪造领域行为。
 */
function inPhase(target: Variable, content: string): JSSContent {
  return { onCompile(context, controller) {
    controller.insert({ before: context.node, conditionPath: appendStateCondition(
      context.conditionPath, resolveStateConditions(['&[data-phase]'])[0],
    ) }, declare(target, content), { owner: context.node })
    controller.remove(context.node, { from: 'output' })
  } }
}

describe('依赖联动', () => {
  test('同一声明节点的内容与 revision 更新后重新绑定本次基础和状态', () => {
    const source = variable(10, { name: 'dependency-declare-revision', states: { '&[data-phase]': base => multiply(base, 2) } })
    const initial = declare(source, 7)
    const css = compileRules([
      [['.Scope'], ...initial], [['.Scope'], 'width', source],
      [[], undefined, { onCompile(_context, controller) {
        let updated = false
        controller.addSettlementCheck(() => {
          if (updated) return false
          updated = true
          const declaration = controller.search({ key: source.key }).find(node => node.content === initial[1])!
          declaration.content = declare(source, 8)[1]
          declaration.compileRevision++
          return true
        })
      } }],
    ])
    expect(declarationsAt(css, ['.Scope'])).toContain('--dependency-declare-revision: 8;')
    expect(declarationsAt(css, ['.Scope', '&[data-phase]'])).toEqual(['--dependency-declare-revision: calc(8*2);'])
  })
  test('动画帧原生属性消费激活依赖，资源描述符不激活', () => {
    const source = variable('5px', { name: 'dependency-frame-source' })
    const line = variable(source, { name: 'dependency-frame-line', priority: 2 })
    const resource = compileRules([
      [['@property --descriptor'], 'initial-value', line],
      [['.Child'], ...declare(source, '7px')],
    ])
    expect(declarationsAt(resource, ['.Child'])).not.toContain('--dependency-frame-line: var(--dependency-frame-source);')
    const css = compileRules([
      [['@keyframes dependency-animation', 'to'], 'width', line],
      [['.Child'], ...declare(source, '7px')],
    ])
    expect(declarationsAt(css, ['.Child'])).toContain('--dependency-frame-line: var(--dependency-frame-source);')
  })

  test('消费节点改读另一变量后撤销旧默认与状态，不要求节点被移除', () => {
    const old = variable('5px', { name: 'dependency-old-usage', states: { '&[data-phase]': '6px' } })
    const next = variable('9px', { name: 'dependency-new-usage' })
    const css = compileRules([
      [['.Parent'], 'width', old],
      [[], undefined, { onCompile(_context, controller) {
        let updated = false
        controller.addSettlementCheck(() => {
          if (updated) return false
          updated = true
          const consumer = controller.search({ key: 'width' })[0]
          consumer.content = next
          consumer.compileRevision++
          return true
        })
      } }],
    ])
    expect(css).not.toContain('--dependency-old-usage:')
    expect(declarationsAt(css, ['.Parent'])).toContain('width: var(--dependency-new-usage);')
  })

  test('配方重访更新默认和联动内容，旧依赖边随当前消费撤销', () => {
    const first = variable(5, { name: 'dependency-revision-first' })
    const second = variable(9, { name: 'dependency-revision-second' })
    let selected = first
    let factor = 2
    const line = variable(() => multiply(selected, factor), { name: 'dependency-revision-line', priority: 2 })
    const css = compileRules([
      [['.Parent'], 'width', line], [['.Parent'], 'height', line],
      [['.Old'], ...declare(first, 7)], [['.New'], ...declare(second, 11)],
      [[], undefined, { onCompile(_context, controller) {
        let updated = false
        controller.addSettlementCheck(() => {
          if (updated) return false
          updated = true
          selected = second
          factor = 3
          controller.remove(controller.search({ key: 'height' })[0])
          controller.search({ key: 'width' })[0].compileRevision++
          return true
        })
      } }],
    ])
    expect(declarationsAt(css, ['.Old'])).toEqual(['--dependency-revision-first: 7;'])
    expect(declarationsAt(css, [':root'])).toContain('--dependency-revision-line: calc(var(--dependency-revision-second)*3);')
    expect(declarationsAt(css, ['.Parent'])).toContain('--dependency-revision-line: calc(var(--dependency-revision-second)*3);')
    expect(declarationsAt(css, ['.New'])).toContain('--dependency-revision-line: calc(var(--dependency-revision-second)*3);')
  })
  test('消费经生产函数与表达式抵达来源，同名另一对象声明联动多个观察者及传递配方', () => {
    const globalSurface = variable(5, { name: 'dependency-surface', priority: 0 })
    const componentSurface = variable(7, { name: 'dependency-surface', priority: 1 })
    const line = variable(() => multiply(globalSurface, 2), { name: 'dependency-line', priority: 2 })
    const outline = variable(line, { name: 'dependency-outline', priority: 3 })
    const gap = variable(globalSurface, { name: 'dependency-gap', priority: 2 })
    const unrelated = variable(7, { name: 'dependency-unrelated', priority: 1 })
    const css = compileRules([
      [['.Parent'], 'width', createJSSContent(resolve => resolve(outline), [outline])],
      [['.Parent'], 'margin-left', gap],
      [['.Child'], ...declare(componentSurface, 7)],
      [['.Other'], ...declare(unrelated, 9)],
    ])
    expect(declarationsAt(css, ['.Child'])).toEqual(expect.arrayContaining([
      '--dependency-surface: 7;',
      '--dependency-line: calc(var(--dependency-surface)*2);',
      '--dependency-outline: var(--dependency-line);',
      '--dependency-gap: var(--dependency-surface);',
    ]))
    expect(declarationsAt(css, ['.Other'])).toEqual(['--dependency-unrelated: 9;'])
    expect(declarationsAt(css, ['.Parent'])).toContain('width: var(--dependency-outline);')
    expect(css).not.toMatch(/var\([^)]*,/)
  })

  test('只有 declare 与真实 Active 资源仍不激活依赖链，原生 Key 的来源声明可触发已消费观察者', () => {
    const source = variable('red', { name: 'dependency-active-source', priority: 0 })
    const line = variable(source, { name: 'dependency-active-line', priority: 2 })
    const resource: JSSContent = {
      dependencies: [line],
      onActive: () => [[['.Resource'], 'display', 'block']],
    }
    const setup: Rules = [
      [[], undefined, resource],
      [['.Defined'], ...declare(line)],
      [['.Child'], ...declare(key('--dependency-active-source'), 'green')],
    ]
    const inactive = compileRules(setup)
    expect(declarationsAt(inactive, ['.Resource'])).toContain('display: block;')
    expect(declarationsAt(inactive, ['.Defined'])).toContain('--dependency-active-line: var(--dependency-active-source);')
    expect(declarationsAt(inactive, ['.Child'])).not.toContain('--dependency-active-line: var(--dependency-active-source);')
    const active = compileRules([...setup, [['.Parent'], 'border-color', line]])
    expect(declarationsAt(active, ['.Child'])).toContain('--dependency-active-line: var(--dependency-active-source);')
  })

  test('联动 declare 直接带上自身状态，状态所属关系不反向激活变量', () => {
    const source = variable('red', { name: 'dependency-state-source', priority: 0 })
    const line = variable(source, {
      name: 'dependency-state-line', priority: 2,
      states: { '&[data-phase]': 'gold' },
    })
    const stateOwner = variable('black', {
      name: 'dependency-state-owner', priority: 1,
      states: { '&[data-owner]': source },
    })
    const css = compileRules([
      [['.Parent'], 'border-color', line],
      [['.StateOwner'], ...declare(stateOwner)],
      [['.Child'], ...declare(source, 'green')],
    ])
    expect(declarationsAt(css, ['.Child', '&[data-phase]'])).toContain('--dependency-state-line: gold;')
    expect(declarationsAt(css, ['.StateOwner', '&[data-owner]'])).toContain('--dependency-state-owner: var(--dependency-state-source);')
    expect(declarationsAt(css, ['.Child']).some(line => line.startsWith('--dependency-state-owner:'))).toBe(false)
  })

  test.each([false, true])('消费者在后续编译波撤销，共享需求仍存在=%s，下一会话不保留观察者', (shared) => {
    const source = variable('red', { name: 'dependency-lifetime-source', priority: 0 })
    const line = variable(source, { name: 'dependency-lifetime-line', priority: 2 })
    const rules: Rules = [
      [['.Parent'], 'border-color', line],
      [['.Child'], ...declare(source, 'green')],
    ]
    if (shared) rules.push([['.Parent'], 'background-color', line])
    rules.push([[], undefined, { compileWaveIndex: 3, onCompile(context, controller) {
      const consumer = controller.search({ key: 'border-color' })[0]
      controller.remove(consumer)
      controller.remove(context.node)
    } }])
    const css = compileRules(rules)
    expect(declarationsAt(css, ['.Child']).includes('--dependency-lifetime-line: var(--dependency-lifetime-source);')).toBe(shared)
    expect(css).not.toContain('border-color:')
    const next = compileRules([[['.Child'], ...declare(source, 'blue')]])
    expect(next).not.toContain('--dependency-lifetime-line:')
    expect(next).toContain('--dependency-lifetime-source: blue;')
  })
})

describe('声明优先级', () => {
  test('可调用 Cluster 原始键保留成员等级，空编译输出不压掉有效低等级', () => {
    const low = variable('red', { name: 'priority-callable', priority: 0 })
    const cluster = variableCluster({ default: low })
    const high = variable('blue', { name: low.name, priority: 5 })
    const empty = variable('unused', { name: 'priority-empty', priority: 9 })
    const fallback = variable('red', { name: empty.name, priority: 1 })
    const css = compileRules([
      [['.Scope'], cluster, 'red'], [['.Scope'], high, 'blue'],
      [['.Empty'], fallback, 'red'], [['.Empty'], empty, value(undefined)],
      [['.Undefined'], fallback, 'red'], [['.Undefined'], empty, undefined],
    ])
    expect(declarationsAt(css, ['.Scope'])).toEqual(['--priority-callable: blue;'])
    expect(declarationsAt(css, ['.Empty'])).toEqual(['--priority-empty: red;'])
    expect(declarationsAt(css, ['.Undefined'])).toEqual(['--priority-empty: red;'])
  })
  test('同名高等级覆盖后写低等级，其他完整地址独立保留', () => {
    const high = variable('red', { name: 'priority-direct', priority: 8 })
    const low = variable('blue', { name: 'priority-direct', priority: 2 })
    const css = compileRules([
      [['.Scope'], ...declare(high)], [['.Scope'], ...declare(low)],
      [['.Other'], ...declare(low)],
    ])
    expect(declarationsAt(css, ['.Scope'])).toEqual(['--priority-direct: red;'])
    expect(declarationsAt(css, ['.Other'])).toEqual(['--priority-direct: blue;'])
  })

  test.each([false, true])('同级 Variable 仍按原书写顺序后写获胜，交换=%s', (reverse) => {
    const first = variable('red', { name: 'priority-tied', priority: 4 })
    const second = variable('blue', { name: 'priority-tied', priority: 4 })
    const items = reverse ? [second, first] : [first, second]
    const css = compileRules(items.map(item => [['.Scope'], ...declare(item)]))
    expect(declarationsAt(css, ['.Scope'])).toEqual([`--priority-tied: ${reverse ? 'red' : 'blue'};`])
  })

  test.each([false, true])('联动与直接声明同级，只按原书写顺序选择，来源后写=%s', (sourceLast) => {
    const source = variable('red', { name: 'priority-source', priority: 0 })
    const line = variable(source, { name: 'priority-line', priority: 6 })
    const direct = variable('blue', { name: 'priority-line', priority: 5 })
    const origin: Rules[number] = [['.Child'], ...declare(source, 'green')]
    const explicit: Rules[number] = [['.Child'], ...declare(direct)]
    const css = compileRules([
      [['.Parent'], 'border-color', line],
      ...(sourceLast ? [explicit, origin] : [origin, explicit]),
    ])
    const values = declarationsAt(css, ['.Child']).filter(line => line.startsWith('--priority-line:'))
    expect(values).toEqual([`--priority-line: ${sourceLast ? 'var(--priority-source)' : 'blue'};`])
  })

  test.each([7, 8, 9].flatMap(priority => [false, true].map(sourceLast => ({ priority, sourceLast }))))(
    '传递状态恰为8，直接银值不被借用重写：对手$priority，来源后写=$sourceLast', ({ priority, sourceLast }) => {
    const source = variable('red', { name: 'priority-chain-source', priority: 0 })
    const middle = variable(source, { name: 'priority-chain-middle', priority: 6 })
    const outer = variable(middle, {
      name: 'priority-chain-outer', priority: 9,
      states: { '&[data-phase]': 'gold' },
    })
    const competitor = variable('blue', {
      name: 'priority-chain-outer', priority,
    })
    const css = compileRules([
      [['.Parent'], 'border-color', outer],
      ...(sourceLast ? [
        [['.Child'], ...declare(competitor)], [['.Child'], undefined, inPhase(competitor, 'silver')],
        [['.Child'], ...declare(source, 'green')],
      ] : [
        [['.Child'], ...declare(source, 'green')],
        [['.Child'], ...declare(competitor)], [['.Child'], undefined, inPhase(competitor, 'silver')],
      ]) as Rules,
    ])
    expect(declarationsAt(css, ['.Child'])).toContain('--priority-chain-middle: var(--priority-chain-source);')
    const linkedWins = priority < 8 || priority === 8 && sourceLast
    expect(declarationsAt(css, ['.Child'])).toContain(`--priority-chain-outer: ${linkedWins ? 'var(--priority-chain-middle)' : 'blue'};`)
    expect(declarationsAt(css, ['.Child', '&[data-phase]'])).toEqual([`--priority-chain-outer: ${linkedWins ? 'gold' : 'silver'};`])
  })

  test('显式 declare 的自身 states 与声明键同级，胜过该状态地址后写的低等级直接声明', () => {
    const high = variable('red', { name: 'priority-state', priority: 6, states: { '&[data-phase]': 'gold' } })
    const low = variable('blue', { name: 'priority-state', priority: 5 })
    const css = compileRules([[['.Scope'], ...declare(high)], [['.Scope'], undefined, inPhase(low, 'silver')]])
    expect(declarationsAt(css, ['.Scope', '&[data-phase]'])).toEqual(['--priority-state: gold;'])
  })

  test('普通 Key 的最高档999与既有同级 join 同时保留', () => {
    const ordinary = key('--priority-key')
    const lower = variable('red', { name: 'priority-key', priority: 998 })
    const sum = key('z-index', { join: values => values.reduce((total, item) => total + Number(item.content), 0) })
    const css = compileRules([
      [['.Scope'], ...declare(ordinary, 'blue')], [['.Scope'], ...declare(lower)],
      [['.Scope'], ...declare(sum, 2)], [['.Scope'], ...declare(sum, 3)],
    ])
    expect(declarationsAt(css, ['.Scope'])).toContain('--priority-key: blue;')
    expect(declarationsAt(css, ['.Scope'])).not.toContain('--priority-key: red;')
    expect(declarationsAt(css, ['.Scope'])).toContain('z-index: 5;')
  })

  test.each([false, true])('普通创建省略 priority 与显式0同级，候选后写=%s', (candidateLast) => {
    const candidate = variable(2, { name: 'priority-default-fresh' })
    const competitor = variable(3, { name: candidate.name, priority: 0 })
    const first: Rules[number] = [['.Scope'], ...declare(candidate, 2)]
    const second: Rules[number] = [['.Scope'], ...declare(competitor)]
    const css = compileRules(candidateLast ? [second, first] : [first, second])
    expect(declarationsAt(css, ['.Scope'])).toEqual([`${candidate.toCSSString()}: ${candidateLast ? 2 : 3};`])
  })

  test.each([
    { mode: '仅 extend', sourcePriority: undefined, expected: 1 },
    { mode: '新默认加 extend', sourcePriority: undefined, expected: 1 },
    { mode: '仅 extend', sourcePriority: 4, expected: 5 },
    { mode: '新默认加 extend', sourcePriority: 4, expected: 5 },
  ])('$mode 未指定 priority 时父级加一：父配置=$sourcePriority，结果=$expected', ({ mode, sourcePriority, expected }) => {
    const source = variable(1, {
      name: 'priority-extend-parent', ...(sourcePriority === undefined ? {} : { priority: sourcePriority }),
    })
    const candidate = mode === '仅 extend' ? variable({ extend: source }) : variable(2, { extend: source })
    // 用实际公开名称配对并显式给基础内容，避免名称/default缺口遮住等级行为。
    const lower = variable(3, { name: candidate.name, priority: expected - 1 })
    const tied = variable(4, { name: candidate.name, priority: expected })
    const css = compileRules([
      [['.AboveParent'], ...declare(candidate, 2)], [['.AboveParent'], ...declare(lower)],
      [['.TiedBefore'], ...declare(candidate, 2)], [['.TiedBefore'], ...declare(tied)],
      [['.TiedAfter'], ...declare(tied)], [['.TiedAfter'], ...declare(candidate, 2)],
    ])
    expect(declarationsAt(css, ['.AboveParent'])).toEqual([`${candidate.toCSSString()}: 2;`])
    expect(declarationsAt(css, ['.TiedBefore'])).toEqual([`${candidate.toCSSString()}: 4;`])
    expect(declarationsAt(css, ['.TiedAfter'])).toEqual([`${candidate.toCSSString()}: 2;`])
  })

  test.each([0, 2])('extend 显式指定 priority=%s，覆盖继承加一的5', (priority) => {
    const source = variable(1, { name: 'priority-explicit-parent', priority: 4 })
    const candidate = variable(2, { extend: source, priority })
    const lower = variable(3, { name: candidate.name, priority: priority - 1 })
    const higher = variable(4, { name: candidate.name, priority: priority + 1 })
    const css = compileRules([
      [['.AboveLower'], ...declare(candidate, 2)], [['.AboveLower'], ...declare(lower)],
      [['.BelowHigher'], ...declare(higher)], [['.BelowHigher'], ...declare(candidate, 2)],
    ])
    expect(declarationsAt(css, ['.AboveLower'])).toEqual([`${candidate.toCSSString()}: 2;`])
    expect(declarationsAt(css, ['.BelowHigher'])).toEqual([`${candidate.toCSSString()}: 4;`])
  })

  test.each([false, true])('后续波加入高等级声明后参与竞争，撤销=%s 时恢复仍需的联动', (remove) => {
    const source = variable('red', { name: 'priority-late-source', priority: 0 })
    const line = variable(source, { name: 'priority-late-line', priority: 6 })
    const high = variable('blue', { name: 'priority-late-line', priority: 8 })
    const declaration = declare(high)
    const css = compileRules([
      [['.Parent'], 'border-color', line], [['.Child'], ...declare(source, 'green')],
      [[], undefined, { compileWaveIndex: 2, onActive: () => [[['.Child'], ...declaration]] }],
      [[], undefined, { compileWaveIndex: 4, onCompile(context, controller) {
        if (remove) {
          const node = controller.search({ key: high.key }).find(node => node.content === declaration[1])
          if (node) controller.remove(node)
        }
        controller.remove(context.node)
      } }],
    ])
    expect(declarationsAt(css, ['.Child']).filter(line => line.startsWith('--priority-late-line:')))
      .toEqual([`--priority-late-line: ${remove ? 'var(--priority-late-source)' : 'blue'};`])
  })
})
