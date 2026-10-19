/** 变量编译工作量的回归验证。
 *
 * 比较消费者增长时的全队列查询次数，并检查依赖结果仍完整。
 *
 * 防止正确样式依靠每个消费者反复搜索全部样式取得。
 */
import { expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { multiply } from '../pieces/contents/functions/calc'
import { variable } from '../variable'
import type { Rules } from '../rule'
import { whenSettled } from './when-settled'
import { parse } from 'postcss'
import { condition } from '../condition'
import { variableProductRoles } from '../variable/declare'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'

test.each([false, true])('同一个消费节点重访时不重复登记撤销，具有显式声明：%s', explicit => {
  let registrations = 0, revisions = 0
  const amount = variable(2, 'work-consumer-lifetime')
  const css = compileRules([
    [[], undefined, { onCompile(_context, controller) {
      const register = controller.onRemove
      controller.onRemove = (node, cleanup) => { if (node.key === 'width') registrations++; register(node, cleanup) }
      controller.addSettlementCheck(() => {
        if (revisions++ >= 20) return false
        if (explicit) controller.search({ key: amount.key }).find(node => (node.content as { kind?: string })?.kind === 'variable-declaration')!.content = declare(amount, revisions)[1]
        else controller.search({ key: 'width' })[0].compileRevision++
        return true
      })
    } }], ...(explicit ? [[['.Consumer'], ...declare(amount, 2)] as Rules[number]] : []), [['.Consumer'], 'width', amount],
  ])
  expect(css).toContain('width: var(--work-consumer-lifetime);')
  // 依赖跟踪与显式声明绑定各自只为该节点登记一次生命周期清理。
  expect(registrations).toBe(explicit ? 2 : 1)
})

test('生成声明第一次被观察时已经具有最终角色', () => {
  const observed: [JSSStyleNode, string | undefined][] = []
  const base = variable(2, 'work-publish-base')
  const derived = variable(multiply(base, 3), { name: 'work-publish-derived', states: { hover: current => multiply(current, 2) } })
  compileRules([
    [[], undefined, { onCompile(_context, controller) {
      controller.observeNodes((node, present) => { if (present) observed.push([node, variableProductRoles.get(node)]) })
    } }], [['.Local'], ...declare(base, 4)], [['.Consumer'], 'width', derived],
  ])
  const generated = observed.filter(([node]) => variableProductRoles.has(node))
  expect(new Set(generated.map(([node]) => variableProductRoles.get(node)))).toEqual(new Set(['base', 'state', 'default', 'linked']))
  expect(generated.every(([node, role]) => role === variableProductRoles.get(node))).toBe(true)
})

test('整批联动退出不逐个重放所有输入声明', () => {
  let armed = false, rounds = 0
  const base = variable(2, 'work-withdraw-base')
  const derived = variable(multiply(base, 3), 'work-withdraw-derived')
  const rules: Rules = [[[], undefined, { onCompile(_context, controller) {
    controller.addSettlementCheck(() => { if (armed) rounds++; return false })
  } }]]
  for (let index = 0; index < 40; index++) rules.push([[`.Local${index}`], ...declare(base, 4)])
  rules.push([['.Consumer'], 'width', derived], [[], undefined, whenSettled(controller => {
    if (!controller.search({ key: derived.key }).some(node => node.conditionPath.targetConditionPath[0]?.header === '.Local39')) return false
    armed = true
    controller.search({ key: 'width' })[0].content = '9px'
    return true
  })])
  const css = compileRules(rules)
  expect(css).toContain('width: 9px;')
  expect(css.match(/--work-withdraw-base: 4;/g)).toHaveLength(40)
  expect(css).not.toContain('--work-withdraw-derived:')
  expect(rounds).toBeLessThanOrEqual(6)
})

test('消费者增加只激活实际依赖，不增加全队列声明查询', () => {
  const counts = [1, 80].map(count => {
    let scans = 0
    const base = variable(2, `work-base-${count}`)
    const derived = variable(multiply(base, 3), { name: `work-derived-${count}`, states: { hover: current => multiply(current, 2) } })
    const rules: Rules = [[[], undefined, { onCompile(_context, controller) {
      const nodes = controller.nodes
      controller.nodes = () => { scans++; return nodes() }
    } }], [['.Local'], ...declare(base, 4)]]
    for (let index = 0; index < count; index++) rules.push([['.Local', `.Consumer${index}`], 'width', multiply(derived, '1px')])
    const css = compileRules(rules)
    expect(css).toContain(`--work-derived-${count}: calc(var(--work-base-${count}) * 3);`)
    expect(css).toContain('* 2)')
    expect(css.match(/width: /g)).toHaveLength(count)
    return scans
  })
  expect(counts[1]).toBeLessThanOrEqual(counts[0] + 1)
  expect(counts[1]).toBeLessThanOrEqual(2)
})

test('当地输入重访不重新分析无关消费者，已处理的依赖仍正确更新', () => {
  let armed = false
  let unrelatedReads = 0
  const base = variable(2, 'work-change-base')
  const derived = variable(multiply(base, 3), 'work-change-derived')
  const unrelated = variable(multiply(variable(5, 'work-idle-base'), 2), 'work-idle-derived')
  const definition = declare(base, 4)
  const css = compileRules([
    [[], undefined, { onCompile(_context, controller) {
      const read = controller.getCompiledContent
      controller.getCompiledContent = (node, input) => {
        if (armed && node.key === 'height') unrelatedReads++
        return read(node, input)
      }
    } }],
    [['.Local'], ...definition], [['.Local'], 'width', multiply(derived, '1px')],
    [['.Unrelated'], 'height', multiply(unrelated, '1px')],
    [[], undefined, whenSettled(controller => {
      if (!controller.search({ key: derived.key }).some(node => node.conditionPath.targetConditionPath[0]?.header === '.Local')) return false
      const node = controller.search({ key: base.key }).find(node => node.content === definition[1])!
      armed = true
      node.content = declare(base, 7)[1]
      return true
    })],
  ])
  const local = parse(css).nodes.find(node => node.type === 'rule' && node.selector === '.Local')!.toString()
  expect(local).toContain('--work-change-base: 7;')
  expect(local).toContain('--work-change-derived: calc(var(--work-change-base) * 3);')
  expect(css).toContain('height: calc(var(--work-idle-derived) * 1px);')
  expect(unrelatedReads).toBe(0)
})

test('密集插入的同址声明仍按书写顺序选当前基础并绑定状态', () => {
  const amount = variable(1, { name: 'work-insert-order', states: { hover: current => multiply(current, 2) } })
  const css = compileRules([
    [['.Ordered'], 'width', amount],
    [[], undefined, whenSettled(controller => {
      const anchor = controller.search({ key: 'width' })[0]
      for (let input = 0; input < 96; input++) controller.insert({ before: anchor, conditionPath: anchor.conditionPath }, [amount, input], { owner: anchor })
      return true
    })],
  ])
  const local = parse(css).nodes.find(node => node.type === 'rule' && node.selector === '.Ordered')!.toString()
  expect(local).toContain('--work-insert-order: 95;')
  expect(local).toContain('--work-insert-order: calc(95 * 2);')
})

test.each(['改名', '移出根'])('原根声明%s后，原名称的默认基础重新可用', change => {
  const size = variable('5px', 'work-root-before')
  const css = compileRules([
    [[':root'], '--work-root-before', '9px'], [['.Consumer'], 'width', size],
    [[], undefined, whenSettled(controller => {
      const root = controller.search({ key: '--work-root-before' }).find(node => node.content === '9px')!
      if (change === '改名') root.key = '--work-root-after'
      else root.conditionPath = { targetConditionPath: [condition('.Local')], stateConditionPath: [] }
      return true
    })],
  ])
  const root = parse(css).nodes.find(node => node.type === 'rule' && node.selector === ':root')!.toString()
  expect(root).toContain('--work-root-before: 5px;')
  expect(css).toContain(change === '改名' ? '--work-root-after: 9px;' : '.Local {\n--work-root-before: 9px;')
})
