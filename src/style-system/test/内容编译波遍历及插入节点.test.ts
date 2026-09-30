/** 内容编译波与节点插入的流程测试。
 *
 * 通过正式 Rules 入口验证延后内容、替代链和插入节点的输出。
 *
 * 防止编译波推进时遗漏未完成内容或重复执行回调。
 */
import { expect, test } from 'vitest'
import { Unresultable } from '@edsolater/fnkit'
import { condition } from '../condition'
import { key } from '../key'
import { stateCondition } from '../pieces/state-conditions'
import { compileRules } from '../css-root'
import { createJSSContent } from '../content'
import { styleNodesToContentNodes } from '../compiler/style-nodes-to-content-nodes'
import { rulesToStyleNodes } from '../compiler/rules-to-style-nodes'
import { value } from '../value'
import { variable } from '../variable'
import { variableCluster } from '../variable-cluster'
import type { JSSCompileContext } from '../index'
import type { ASTController } from '../compiler/ast-controller'

import type { JSSKeyObject } from '../key'
import type { JSSContentContext, JSSContent } from '../content'
import type { Rules } from '../rule'

test.each([['最早编译波', '撤销'], ['暂缓', '撤销'], ['最早编译波', '退出输出'], ['暂缓', '退出输出']])('本波%s等待的声明%s后，只按当前输出队列判断完成', (waiting, removal) => {
  let delayedCalls = 0
  const css = compileRules([
    [[], 'width', { compileWaveIndex: waiting === '最早编译波' ? 2 : 0, onCompile(context, ast) {
      delayedCalls++
      if (waiting === '暂缓') { ast.defer(context.node, '待定义'); return undefined }
      return '9px'
    } }],
    [[], 'color', { onCompile(_, ast) { ast.remove(ast.search({ key: 'width' })[0], removal === '退出输出' ? { from: 'output' } : undefined); return 'red' } }],
  ])
  expect(css).toBe('color: red;')
  expect(delayedCalls).toBe(waiting === '最早编译波' ? 0 : 1)
})
stateCondition('contentWaveHover', condition('&:where([data-wave-hover])'))

test('Key 替换路径后，Content 激活仍复制节点访问开始时取得的路径引用', () => {
  let observed: string[] = []
  const target: JSSKeyObject & JSSContent = { toCSSString: () => 'width', onCompile(context) {
    context.node.conditionPath.targetConditionPath.push(condition('.ChangedBefore'))
    context.node.conditionPath = { targetConditionPath: [condition('.After')], stateConditionPath: [] }
    return this
  } }
  const content: JSSContent = { onActive(context) {
    observed = context.conditionPath.targetConditionPath.map(item => item.header)
    return []
  }, toCSSString: () => '7px' }
  const css = compileRules([[[condition('.Before')], target, content]])
  expect(observed).toEqual(['.Before', '.ChangedBefore'])
  expect(css).toContain('.After')
  expect(css).toContain('width: 7px;')
})

test('返回的替代内容跨波等待，源回调不重调且最早波限制生效', () => {
  const events: string[] = []
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile() {
    expect(events).toEqual(['source', 'middle'])
    events.push('delayed')
    return '9px'
  } }
  const source: JSSContent = { onCompile() { events.push('source'); return delayed } }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile() { events.push('middle'); return 1 } }
  const css = compileRules([[[condition('.WaitingReplacement')], 'width', source], [[], 'order', middle]])

  expect(events).toEqual(['source', 'middle', 'delayed'])
  expect(css).toContain('width: 9px;')
})

test('多层替代链分别等待各自编译波，完成结果回到原声明', () => {
  const events: string[] = []
  const final: JSSContent = { compileWaveIndex: 4, onCompile() {
    expect(events).toEqual(['source', 'middle', 'delayed', 'later'])
    events.push('final')
    return '11px'
  } }
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile() { events.push('delayed'); return final } }
  const source: JSSContent = { onCompile() { events.push('source'); return delayed } }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile() { events.push('middle'); return 1 } }
  const later: JSSContent = { compileWaveIndex: 3, onCompile() { events.push('later'); return 2 } }
  const css = compileRules([[[], 'width', source], [[], 'order', middle], [[], 'z-index', later]])

  expect(events).toEqual(['source', 'middle', 'delayed', 'later', 'final'])
  expect(css).toContain('width: 11px;')
})

test('Key 返回的替代链也继续等待，不因源回调已调用就跳过后续对象', () => {
  const events: string[] = []
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile() {
    expect(events).toEqual(['key', 'middle'])
    events.push('delayed')
    return 'width'
  } }
  const target: JSSKeyObject & JSSContent = {
    toCSSString: () => 'width',
    onCompile() { events.push('key'); return delayed },
  }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile() { events.push('middle'); return 1 } }
  const css = compileRules([[[], target, '9px'], [[], 'order', middle]])

  expect(events).toEqual(['key', 'middle', 'delayed'])
  expect(css).toContain('width: 9px;')
})

test('跨波替代链回到已有对象时仍诊断循环', () => {
  let sourceCalls = 0
  let delayedCalls = 0
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile() { delayedCalls++; return source } }
  const source: JSSContent = { onCompile() { sourceCalls++; return delayed } }

  expect(() => compileRules([[[], 'width', source]])).toThrow('循环引用')
  expect(sourceCalls).toBe(1)
  expect(delayedCalls).toBe(1)
})

test('角色输入保持快照，嵌套编译沿用快照，Controller 跨角色复用', () => {
  const contexts: JSSCompileContext[] = []
  const controllers: ASTController[] = []
  const nested: JSSContent = { onCompile(context, ast) {
    contexts.push(context)
    controllers.push(ast)
    return '3px'
  } }
  const replacement: JSSContent = { dependencies: [nested], onCompile(context, ast) {
    contexts.push(context)
    controllers.push(ast)
    return replacement
  }, toCSSString: () => '3px' }
  const source: JSSContent = { onCompile(context, ast) {
    contexts.push(context)
    controllers.push(ast)
    context.node.key = 'width'
    context.node.content = '2px'
    context.node.conditionPath.targetConditionPath.push(condition('.later'))
    return replacement
  } }
  const target: JSSKeyObject & JSSContent = { toCSSString: () => 'height', onCompile(context, ast) {
    contexts.push(context)
    controllers.push(ast)
    context.node.key = 'height'
    context.node.conditionPath.targetConditionPath.push(condition('.live'))
    return target
  } }
  const input: Rules = [[[condition('.snapshot')], target, source]]
  compileRules(input)
  const [keyContext, contentContext, returnedContext, nestedContext] = contexts
  expect(keyContext.role).toBe('declaration-key')
  expect(keyContext.key).toBe(target)
  expect(keyContext.content).toBe(source)
  expect(keyContext.conditionPath.targetConditionPath.map(item => item.header)).toEqual(['.snapshot'])
  expect(contentContext.role).toBe('declaration-content')
  expect(contentContext.key).toBe('height')
  expect(contentContext.content).toBe(source)
  expect(contentContext.conditionPath.targetConditionPath.map(item => item.header)).toEqual(['.snapshot', '.live'])
  expect(contentContext.node.key).toBe('width')
  expect(contentContext.node.content).toBe('2px')
  expect(returnedContext).toBe(contentContext)
  expect(nestedContext).toBe(contentContext)
  expect(keyContext.node).toBe(contentContext.node)
  expect(keyContext.session).toBe(contentContext.session)
  expect('compileWaveIndex' in keyContext).toBe(false)
  expect('compileWaveIndex' in contentContext).toBe(false)
  expect(new Set(controllers).size).toBe(1)
  compileRules(input)
  expect(contexts[4].session).not.toBe(keyContext.session)
  expect(controllers[4]).not.toBe(controllers[0])
})

test('状态沿返回内容和 dependencies 传递，Cluster 转交默认成员且 Key 不携带读取状态', () => {
  const cluster = variableCluster({ default: variable('red', {
    name: 'context-state-default', states: { contentWaveHover: 'blue' },
  }) })
  const roles: [string, string | undefined][] = []
  const child: JSSContent = { onCompile(context) {
    roles.push([context.role, context.readState])
    return value(cluster)
  } }
  const returned: JSSContent = { dependencies: [child], toCSSString: () => '1px', onCompile(context) {
    roles.push([context.role, context.readState])
    return returned
  } }
  const target: JSSKeyObject & JSSContent = { toCSSString: () => 'color', onCompile(context) {
    roles.push([context.role, context.readState])
    return target
  } }
  const generator: JSSContent = { onCompile(context, ast) {
    const first = ast.insert({ before: context.node, conditionPath: context.conditionPath },
      [target, value(cluster)], { owner: context.node })
    first.readState = 'contentWaveHover'
    const second = ast.insert({ before: context.node, conditionPath: context.conditionPath },
      ['width', { onCompile: () => returned }], { owner: context.node })
    second.readState = 'contentWaveHover'
    return undefined
  } }
  const css = compileRules([[[condition('.StateContext')], 'display', generator]])
  expect(roles).toEqual([
    ['declaration-key', undefined],
    ['declaration-content', 'contentWaveHover'],
    ['declaration-content', 'contentWaveHover'],
  ])
  expect(css).toContain('color: blue;')
  expect(css).not.toContain('var(--context-state-default')
})

test('正式 Rule 按编译波访问嵌套 Content，读取复合地址并把插入节点接回 Root 队列', () => {
  const events: string[] = []
  const nested = {
    dependencies: ['6px'],
    compileWaveIndex: 0,
    onCompile() {
      events.push('nested')
      return value('6px')
    },
  }
  let observedController: ASTController | undefined
  let observedCompileContext: JSSCompileContext | undefined
  const content = {
    dependencies: [nested],
    compileWaveIndex: 2,
    onCompile(context: JSSCompileContext, controller: ASTController) {
      events.push('delayed')
      observedController = controller
      observedCompileContext = context
      controller.insert({ before: context.node, conditionPath: context.conditionPath }, [key('--wave-inserted-value'), '9px'], { owner: context.node })
      return value(createJSSContent((resolve) => {
        const input = resolve(nested)
        return input === undefined ? undefined : `calc(${input} * 2)`
      }, [nested]))
    },
  }
  let updatedInsertedNode = false
  const laterContent = {
    compileWaveIndex: 2,
    onCompile(context: JSSCompileContext, controller: ASTController) {
      const inserted = controller.search({ key: key('--wave-inserted-value'), conditionPath: context.conditionPath })[0]
      if (!inserted) throw new Error('后续编译对象没有观察到前序插入。')
      inserted.content = '11px'
      updatedInsertedNode = true
      return '4px'
    },
  }
  const css = compileRules([
    [[condition('.WaveContent'), 'contentWaveHover'], 'color', 'red'],
    [[condition('.WaveContent'), 'contentWaveHover'], 'width', content],
    [[condition('.WaveContent'), 'contentWaveHover'], 'height', laterContent],
    [[condition('.WaveContent')], 'order', { compileWaveIndex: 1, onCompile() { events.push('middle'); return 1 } }],
  ])

  expect(events).toEqual(['nested', 'middle', 'delayed'])
  expect(observedCompileContext?.conditionPath.targetConditionPath.map((item) => item.header)).toEqual(['.WaveContent'])
  expect(observedCompileContext?.conditionPath.stateConditionPath.map((item) => item.name)).toEqual(['contentWaveHover'])
  expect(observedController?.search({ key: key('color') })[0]?.content).toBe('red')
  expect(updatedInsertedNode).toBe(true)
  expect(css).toContain('--wave-inserted-value: 11px;')
  expect(css).toContain('width: calc(6px * 2);')
  expect(content.dependencies[0]).toBe(nested)
  expect(nested.dependencies).toEqual(['6px'])
})

test('后续对象修改已编译的队列节点时，最终输出读取最终队列内容', () => {
  const mutator = {
    onCompile(context: JSSCompileContext, controller: ASTController) {
      const existing = controller.search({ key: key('--audit-existing-node'), conditionPath: context.conditionPath })[0]
      if (!existing) throw new Error('没有找到此前的队列节点。')
      existing.content = '11px'
      return '5px'
    },
  }
  const css = compileRules([
    [[condition('.AuditMutation')], key('--audit-existing-node'), '9px'],
    [[condition('.AuditMutation')], 'width', mutator],
  ])

  expect(css).toContain('--audit-existing-node: 11px;')
  expect(css).not.toContain('--audit-existing-node: 9px;')
  expect(css).toContain('width: 5px;')
})

test('角色改写自身的内容或 Key 时，旧访问结果不归给新输入', () => {
  let nextContentCalls = 0
  let nextKeyCalls = 0
  const nextContent = { onCompile() { nextContentCalls++; return '7px' } }
  const source = { onCompile(context: JSSCompileContext) { context.node.content = nextContent; return '3px' } }
  const nextKey: JSSKeyObject & JSSContent = {
    onCompile() { nextKeyCalls++; return this },
    toCSSString: () => '--next-key',
  }
  const sourceKey: JSSKeyObject & JSSContent = {
    onCompile(context) { context.node.key = nextKey; return this },
    toCSSString: () => '--old-key',
  }
  const css = compileRules([[[], 'width', source], [[], sourceKey, '8px']])
  expect(nextContentCalls).toBe(1)
  expect(nextKeyCalls).toBe(1)
  expect(css).toContain('width: 7px;')
  expect(css).toContain('--next-key: 8px;')
  expect(css).not.toContain('3px')
  expect(css).not.toContain('--old-key')
})

test('统一失效在访问前、波末和 revision 改写时重新访问对应角色', () => {
  const calls = { original: 0, before: 0, after: 0, key: 0, revised: 0, stable: 0 }
  const original = { onCompile() { calls.original++; return '1px' } }
  const before = { onCompile() { calls.before++; return '2px' } }
  const after = { onCompile() { calls.after++; return '4px' } }
  const revised = { onCompile() { calls.revised++; return calls.revised === 1 ? '5px' : '6px' } }
  const newKey: JSSKeyObject & JSSContent = { onCompile() { calls.key++; return this }, toCSSString: () => '--changed-key' }
  let changed = false
  const css = compileRules([
    [[], 'top', { onCompile(_, ast) {
      const future = ast.search({ key: 'width' })[0]
      future.content = before
      future.key = newKey
      return '0px'
    } }],
    [[], 'width', original],
    [[], 'height', original],
    [[], 'margin', revised],
    [[], 'order', { onCompile() { calls.stable++; return 1 } }],
    [[], 'bottom', { onCompile(_, ast) {
      if (!changed) {
        changed = true
        ast.search({ key: 'height' })[0].content = after
        ast.search({ key: 'margin' })[0].compileRevision++
      }
      return '0px'
    } }],
  ])
  expect(calls).toEqual({ original: 1, before: 1, after: 1, key: 1, revised: 2, stable: 1 })
  expect(css).toContain('--changed-key: 2px;')
  expect(css).toContain('height: 4px;')
  expect(css).toContain('margin: 6px;')
  expect(css).not.toContain('1px')
  expect(css).not.toContain('5px')
})

test('访问前失效本波重访已有缓存，波末失效重访被后项替换的 Key', () => {
  const events: string[] = []
  const oldContent = { onCompile() { events.push('old-content'); return '1px' } }
  const nextContent = { onCompile() { events.push('next-content'); return '2px' } }
  const oldKey: JSSKeyObject & JSSContent = { onCompile() { events.push('old-key'); return this }, toCSSString: () => '--before-key' }
  const nextKey: JSSKeyObject & JSSContent = { onCompile() { events.push('next-key'); return this }, toCSSString: () => '--before-next' }
  const afterKey: JSSKeyObject & JSSContent = { onCompile() { events.push('after-key'); return this }, toCSSString: () => '--after-next' }
  const css = compileRules([
    [[], 'top', { compileWaveIndex: 1, onCompile(_, ast) {
      expect(events).toEqual(['old-key', 'old-content'])
      const cached = ast.search({ key: '--before-key' })[0]
      cached.key = nextKey
      cached.content = nextContent
      return '0px'
    } }],
    [[], oldKey, oldContent],
    [[], '--after-key', '3px'],
    [[], 'bottom', { compileWaveIndex: 1, onCompile(_, ast) {
      expect(events).toEqual(['old-key', 'old-content', 'next-key', 'next-content'])
      ast.search({ key: '--after-key' })[0].key = afterKey
      return '0px'
    } }],
  ])
  expect(events).toEqual(['old-key', 'old-content', 'next-key', 'next-content', 'after-key'])
  expect(css).toContain('--before-next: 2px;')
  expect(css).toContain('--after-next: 3px;')
  expect(css).not.toContain('--before-key:')
  expect(css).not.toContain('--after-key:')
})

test('普通节点编译不逐角色扫描输出队列判断成员', () => {
  const nodes = rulesToStyleNodes(Array.from({ length: 200 }, (_, index) => [[], `--membership-${index}`, index]))
  let comparisons = 0
  nodes.includes = (target) => {
    for (const candidate of nodes) {
      comparisons++
      if (candidate === target) return true
    }
    return false
  }
  expect(styleNodesToContentNodes(nodes, [])).toHaveLength(200)
  expect(comparisons).toBe(0)
})

test.each([20, 40])('按需资源每批线性收集激活关联，不逐项反查无关记录：%s', (count) => {
  let associationScans = 0
  let relationReads = 0
  let repeatedActivations = 0
  let resourceVisits = 0
  const source: Rules = []
  for (let index = 0; index < count; index++) {
    const resources: Rules = [[[condition('.AssociatedResources')], `--resource-${index}`, index]]
    resources.includes = (entry) => { associationScans++; return Array.prototype.includes.call(resources, entry) }
    resources[Symbol.iterator] = function* () {
      for (let offset = 0; offset < resources.length; offset++) { relationReads++; yield resources[offset] }
      return undefined
    }
    source.push([[], `--consumer-${index}`, { onActive: () => resources }])
  }
  const repeated = {
    onActive() {
      repeatedActivations++
      return [[[condition('.RepeatedResource')], 'color', { onCompile() { resourceVisits++; return 'blue' } }]] as Rules
    },
  }
  source.push([[], 'width', repeated])
  source.push([[], 'height', { compileWaveIndex: 2, onCompile() { return repeated } }])
  const css = compileRules(source)
  expect(css).toContain(`--resource-${count - 1}: ${count - 1};`)
  expect(css).toContain('.RepeatedResource {\ncolor: blue;')
  expect(repeatedActivations).toBe(1)
  expect(resourceVisits).toBe(1)
  expect(associationScans).toBe(0)
  expect(relationReads).toBe(count * 2)
})

test('同一 Rule 身份的多个激活记录均关联最后产物，不将不同 Rule 当成获胜记录', () => {
  let visits = 0
  const sharedRule: Rules[0] = [[condition('.SharedRuleIdentity')], 'color', { onCompile() { visits++; return 'blue' } }]
  const first: JSSContent = { onActive: () => [sharedRule] }
  const other: JSSContent = { onActive: () => [[[condition('.SharedRuleIdentity')], 'color', 'red']] }
  const same: JSSContent = { onActive: () => [sharedRule] }
  const css = compileRules([
    [[], 'width', first], [[], 'height', other], [[], 'margin', same],
    [[], 'padding', { compileWaveIndex: 2, onCompile() { return first } }],
  ])
  expect(css).toContain('color: blue;')
  expect(css).not.toContain('color: red;')
  expect(visits).toBe(1)
})

test('再次消费激活内容时使用当前 Rules，并退出已经替换的 Rule 关联', () => {
  const resources: Rules = []
  const content: JSSContent = { onActive: () => resources }
  const css = compileRules([
    [[], 'width', content],
    [[], 'height', { compileWaveIndex: 1, onCompile() {
      resources.push([[], 'color', 'red'])
      return content
    } }],
  ])
  expect(css).toContain('color: red;')

  let oldVisits = 0
  let newVisits = 0
  const original: Rules[0] = [[condition('.ChangedActiveRules')], 'color', { onCompile() { oldVisits++; return 'red' } }]
  const replacement: Rules[0] = [[condition('.ChangedActiveRules')], 'color', { onCompile() { newVisits++; return 'blue' } }]
  const changed: Rules = [original]
  const active: JSSContent = { onActive: () => changed }
  const output = compileRules([
    [[], 'width', active],
    [[], 'height', { onCompile() { changed.splice(0, 1, replacement); return active } }],
    [[], 'margin', { compileWaveIndex: 2, onCompile() { return active } }],
  ])
  expect(output).toContain('color: blue;')
  expect(output).not.toContain('color: red;')
  expect(oldVisits).toBe(0)
  expect(newVisits).toBe(1)
})

test.each(['append', 'delete', 'replace'])('未再次消费的记录改写 Rules，生成时按当前身份关联：%s', (change) => {
  let originalVisits = 0
  let replacementVisits = 0
  const original: Rules[0] = [[condition('.CurrentActiveRules')], 'color', { onCompile() { originalVisits++; return 'red' } }]
  const replacement: Rules[0] = [[condition('.CurrentActiveRules')], 'color', { onCompile() { replacementVisits++; return 'blue' } }]
  const resources: Rules = change === 'append' ? [] : [original]
  const first: JSSContent = { onActive: () => resources }
  const winner: JSSContent = { onActive: () => [original] }
  const css = compileRules([
    [[], 'width', first],
    [[], 'height', winner],
    [[], 'margin', { onCompile() {
      if (change === 'append') resources.push(original)
      else resources.splice(0, 1, ...(change === 'replace' ? [replacement] : []))
      return undefined
    } }],
    [[], 'padding', { compileWaveIndex: 2, onCompile() {
      expect(originalVisits).toBe(1)
      if (change === 'delete') resources.push(replacement)
      return first
    } }],
  ])
  expect(originalVisits).toBe(1)
  expect(replacementVisits).toBe(change === 'append' ? 0 : 1)
  expect(css).toContain(`color: ${change === 'append' ? 'red' : 'blue'};`)
  if (change !== 'append') expect(css).not.toContain('color: red;')
})

test.each([false, true])('同址按需资源最后替换，多个消费者撤销仍保留共享=%s', (keepShared) => {
  let cleanups = 0
  const old: JSSContent = { onActive: () => [[[condition('.SharedResource')], 'color', 'red']] }
  const shared: JSSContent = { onActive: () => [[[condition('.SharedResource')], 'color', {
    onCompile(context: JSSCompileContext, ast: ASTController) { ast.onRemove(context.node, () => { cleanups++ }); return 'blue' },
  }]] }
  const css = compileRules([
    [[], 'width', old],
    [[], 'height', shared],
    [[], 'margin', shared],
    [[], 'padding', { compileWaveIndex: 2, onCompile(_, ast) {
      ast.remove(ast.search({ key: 'width' })[0])
      ast.remove(ast.search({ key: 'height' })[0])
      if (!keepShared) ast.remove(ast.search({ key: 'margin' })[0])
      return undefined
    } }],
  ])
  expect(css.includes('color: blue;')).toBe(keepShared)
  expect(css).not.toContain('color: red;')
  expect(cleanups).toBe(keepShared ? 0 : 1)
})

test('自定义 Key 只凭通用 onCompile 与输出能力插入节点', () => {
  let compileCalls = 0
  const customKey: JSSKeyObject & JSSContent = {
    toCSSString: () => '--custom-compiled-key',
    onCompile(context: JSSCompileContext, controller: ASTController) {
      compileCalls++
      controller.insert({ before: context.node, conditionPath: context.conditionPath }, ['--custom-key-dependency', '7px'], { owner: context.node })
      return this
    },
  }
  const css = compileRules([[[condition('.CustomKey')], customKey, '5px']])

  expect(compileCalls).toBe(1)
  expect(css).toContain('--custom-key-dependency: 7px;')
  expect(css).toContain('--custom-compiled-key: 5px;')
})

test.each([false, true])('onActive 内容生成按需 Rules，带空 dependencies=%s 时本声明不输出', (hasDependencies) => {
  let activations = 0
  let observedContext: JSSContentContext | undefined
  const lifecycleOnly = {
    ...(hasDependencies ? { dependencies: [] } : {}),
    onActive(context: JSSContentContext) {
      activations++
      observedContext = context
      return [[[condition('.LifecycleDependency')], 'color', 'red']] as Rules
    },
  }
  const css = compileRules([
    [[condition('.LifecycleOnly'), 'contentWaveHover'], 'display', lifecycleOnly],
  ])

  expect(activations).toBe(1)
  expect(observedContext?.conditionPath.targetConditionPath.map((item) => item.header)).toEqual(['.LifecycleOnly'])
  expect(observedContext?.conditionPath.stateConditionPath.map((item) => item.name)).toEqual(['contentWaveHover'])
  expect(css).toContain('.LifecycleDependency')
  expect(css).toContain('color: red;')
  expect(css).not.toContain('display:')
  expect(() => compileRules([[[condition('.Invalid')], 'color', {}]])).toThrow('不是可编译的 CSS 内容')
})

test('只有子内容的对象等依赖完成后不输出当前声明', () => {
  let visits = 0
  const child: JSSContent = { compileWaveIndex: 2, onCompile() { visits++; return '9px' } }
  const container: JSSContent = { dependencies: [child] }

  expect(compileRules([[[], 'width', container]])).toBe('')
  expect(visits).toBe(1)
})

test('返回的无输出容器保留未完成依赖，完成后才退出当前声明', () => {
  const events: string[] = []
  const child: JSSContent = { compileWaveIndex: 2, onCompile() {
    expect(events).toEqual(['source', 'middle'])
    events.push('child')
    return '9px'
  } }
  const container: JSSContent = {
    dependencies: [child],
    onActive: () => [[[condition('.NoOutputResource')], 'color', 'red']],
  }
  const source: JSSContent = { onCompile() { events.push('source'); return container } }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile() { events.push('middle'); return 1 } }
  const css = compileRules([[[], 'width', source], [[], 'order', middle]])

  expect(events).toEqual(['source', 'middle', 'child'])
  expect(css).toContain('.NoOutputResource')
  expect(css).toContain('color: red;')
  expect(css).not.toContain('width:')
})

test('dependencies getter 每次访问只读取一次，并在后续波重新读取', () => {
  let dependencyReads = 0
  let childCalls = 0
  const child: JSSContent = { compileWaveIndex: 2, onCompile() { childCalls++; return '9px' } }
  const content: JSSContent = {
    get dependencies() { dependencyReads++; return [child] },
    toCSSString: (resolve) => resolve?.(child),
  }
  const css = compileRules([[[], 'width', content]])

  expect(css).toContain('width: 9px;')
  expect(childCalls).toBe(1)
  expect(dependencyReads).toBe(3)
})

test('Variable Content 根 onCompile 返回值进入正式 CSS 输出', () => {
  const source = variable('red', { name: 'content-root-replacement' })
  const css = compileRules([[[condition('.ContentRootReplacement')], 'color', source]])

  expect(css).toContain('color: var(--content-root-replacement, red);')
})

test('Variable source 与状态中的可调用内容按对象编译而非工厂调用', () => {
  let sourceCompileCalls = 0
  let sourceFactoryCalls = 0
  const source = Object.assign(() => {
    sourceFactoryCalls++
    return 'green'
  }, {
    [Unresultable]: true,
    onCompile() {
      sourceCompileCalls++
      return 'red'
    },
  })
  let stateCompileCalls = 0
  let stateFactoryCalls = 0
  const state = Object.assign(() => {
    stateFactoryCalls++
    return 'yellow'
  }, {
    [Unresultable]: true,
    onCompile() {
      stateCompileCalls++
      return 'blue'
    },
  })
  const css = compileRules([[
    [condition('.CompilableFunction'), 'contentWaveHover'],
    'color',
    variable(source, { name: 'compilable-function-color', states: { contentWaveHover: state } }),
  ]])

  expect(sourceCompileCalls).toBe(1)
  expect(sourceFactoryCalls).toBe(0)
  expect(stateCompileCalls).toBe(1)
  expect(stateFactoryCalls).toBe(0)
  expect(css).toContain('color: var(--compilable-function-color, red);')
  expect(css).toContain('--compilable-function-color: blue;')
  expect(css).not.toContain('green')
  expect(css).not.toContain('yellow')
})
