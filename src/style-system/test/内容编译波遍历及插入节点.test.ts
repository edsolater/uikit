/** 内容编译波与节点插入的流程测试。
 *
 * 通过正式 Rules 入口验证延后内容、替代链和插入节点的输出。
 *
 * 防止编译波推进时遗漏未完成内容或重复执行回调。
 */
import { expect, test } from 'vitest'
import { Unresultable } from '@edsolater/fnkit'
import { condition } from '../condition'
import { key, type JSSKeyObject } from '../key'
import { stateCondition } from '../pieces/state-conditions'
import { compileRules } from '../css-root'
import { createJSSContent, type JSSCompileContext, type JSSContentContext, type JSSContent } from '../content'
import { value } from '../value'
import { variable } from '../variable'
import { variableCluster } from '../variable-cluster'
import type { ASTController } from '../compiler/ast-controller'

import type { Rules } from '../rule'

test.each([['最早编译波', '撤销'], ['暂缓', '撤销'], ['最早编译波', '退出输出'], ['暂缓', '退出输出']])('本波%s等待的声明%s后，只按当前输出队列判断完成', (waiting, removal) => {
  let delayedCalls = 0
  const css = compileRules([
    [[], 'width', { compileWaveIndex: waiting === '最早编译波' ? 2 : 0, onCompile(context, ast) {
      delayedCalls++
      if (waiting === '暂缓') { ast.defer(context.node, '待定义'); return }
      ast.setContent(context, '9px'); } }],
    [[], 'color', { onCompile(context, ast) { ast.remove(ast.search({ key: 'width' })[0], removal === '退出输出' ? { from: 'output' } : undefined); ast.setContent(context, 'red'); } }],
  ])
  expect(css).toBe('color: red;')
  expect(delayedCalls).toBe(waiting === '最早编译波' ? 0 : 1)
})
stateCondition('contentWaveHover', condition('&:where([data-wave-hover])'))

test('Key 替换路径后，Content 激活仍复制节点访问开始时取得的路径引用', () => {
  let observed: string[] = []
  const target: JSSKeyObject & JSSContent = { toCSSString: () => 'width', onCompile(context, controller) {
    context.node.conditionPath.targetConditionPath.push(condition('.ChangedBefore'))
    context.node.conditionPath = { targetConditionPath: [condition('.After')], stateConditionPath: [] }
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

test('Controller 设定的替代内容跨波等待，源回调不重调且最早波限制生效', () => {
  const events: string[] = []
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) {
    expect(events).toEqual(['source', 'middle'])
    events.push('delayed')
    controller.setContent(context, '9px'); } }
  const source: JSSContent = { onCompile(context, controller) { events.push('source'); controller.setContent(context, delayed); } }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile(context, controller) { events.push('middle'); controller.setContent(context, 1); } }
  const css = compileRules([[[condition('.WaitingReplacement')], 'width', source], [[], 'order', middle]])

  expect(events).toEqual(['source', 'middle', 'delayed'])
  expect(css).toContain('width: 9px;')
})

test('多层替代链分别等待各自编译波，完成结果回到原声明', () => {
  const events: string[] = []
  const final: JSSContent = { compileWaveIndex: 4, onCompile(context, controller) {
    expect(events).toEqual(['source', 'middle', 'delayed', 'later'])
    events.push('final')
    controller.setContent(context, '11px'); } }
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) { events.push('delayed'); controller.setContent(context, final); } }
  const source: JSSContent = { onCompile(context, controller) { events.push('source'); controller.setContent(context, delayed); } }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile(context, controller) { events.push('middle'); controller.setContent(context, 1); } }
  const later: JSSContent = { compileWaveIndex: 3, onCompile(context, controller) { events.push('later'); controller.setContent(context, 2); } }
  const css = compileRules([[[], 'width', source], [[], 'order', middle], [[], 'z-index', later]])

  expect(events).toEqual(['source', 'middle', 'delayed', 'later', 'final'])
  expect(css).toContain('width: 11px;')
})

test('Key 设定的内容链也继续等待，不因源回调已调用就跳过后续对象', () => {
  const events: string[] = []
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) {
    expect(events).toEqual(['key', 'middle'])
    events.push('delayed')
    controller.setContent(context, 'width'); } }
  const target: JSSKeyObject & JSSContent = {
    toCSSString: () => 'width',
    onCompile(context, controller) { events.push('key'); controller.setContent(context, delayed); },
  }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile(context, controller) { events.push('middle'); controller.setContent(context, 1); } }
  const css = compileRules([[[], target, '9px'], [[], 'order', middle]])

  expect(events).toEqual(['key', 'middle', 'delayed'])
  expect(css).toContain('width: 9px;')
})

test('跨波替代链回到已有对象时仍诊断循环', () => {
  let sourceCalls = 0
  let delayedCalls = 0
  const delayed: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) { delayedCalls++; controller.setContent(context, source); } }
  const source: JSSContent = { onCompile(context, controller) { sourceCalls++; controller.setContent(context, delayed); } }

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
    ast.setContent(context, '3px'); } }
  const replacement: JSSContent = { dependencies: [nested], onCompile(context, ast) {
    contexts.push(context)
    controllers.push(ast)

  }, toCSSString: () => '3px' }
  const source: JSSContent = { onCompile(context, ast) {
    contexts.push(context)
    controllers.push(ast)
    context.node.key = 'width'
    context.node.content = '2px'
    context.node.conditionPath.targetConditionPath.push(condition('.later'))
    ast.setContent(context, replacement); } }
  const target: JSSKeyObject & JSSContent = { toCSSString: () => 'height', onCompile(context, ast) {
    contexts.push(context)
    controllers.push(ast)
    context.node.key = 'height'
    context.node.conditionPath.targetConditionPath.push(condition('.live'))
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
  expect(contentContext.input).toBe(source)
  expect(returnedContext.input).toBe(replacement)
  expect(nestedContext.input).toBe(nested)
  expect(returnedContext.content).toBe(contentContext.content)
  expect(nestedContext.content).toBe(contentContext.content)
  expect(returnedContext.conditionPath).toBe(contentContext.conditionPath)
  expect(nestedContext.conditionPath).toBe(contentContext.conditionPath)
  expect(keyContext.node).toBe(contentContext.node)
  expect(keyContext.session).toBe(contentContext.session)
  expect(new Set(controllers).size).toBe(1)
  compileRules(input)
  expect(contexts[4].session).not.toBe(keyContext.session)
  expect(controllers[4]).not.toBe(controllers[0])
})

test('正式 Rule 按编译波访问嵌套 Content，读取复合地址并把插入节点接回 Root 队列', () => {
  const events: string[] = []
  const nested = {
    dependencies: ['6px'],
    compileWaveIndex: 0,
    onCompile(context, controller) {
      events.push('nested')
      controller.setContent(context, value('6px')); },
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
      controller.setContent(context, value(createJSSContent((resolve) => {
        const input = resolve(nested)
        return input === undefined ? undefined : `calc(${input} * 2)`
      }, [nested]))); },
  }
  let updatedInsertedNode = false
  const laterContent = {
    compileWaveIndex: 2,
    onCompile(context: JSSCompileContext, controller: ASTController) {
      const inserted = controller.search({ key: key('--wave-inserted-value'), conditionPath: context.conditionPath })[0]
      if (!inserted) throw new Error('后续编译对象没有观察到前序插入。')
      inserted.content = '11px'
      updatedInsertedNode = true
      controller.setContent(context, '4px'); },
  }
  const css = compileRules([
    [[condition('.WaveContent'), condition('&:where([data-wave-hover])')], 'color', 'red'],
    [[condition('.WaveContent'), condition('&:where([data-wave-hover])')], 'width', content],
    [[condition('.WaveContent'), condition('&:where([data-wave-hover])')], 'height', laterContent],
    [[condition('.WaveContent')], 'order', { compileWaveIndex: 1, onCompile(context, controller) { events.push('middle'); controller.setContent(context, 1); } }],
  ])

  expect(events).toEqual(['nested', 'middle', 'delayed'])
  expect(observedCompileContext?.conditionPath.targetConditionPath.map((item) => item.header)).toEqual(['.WaveContent', '&:where([data-wave-hover])'])
  expect(observedCompileContext?.conditionPath.stateConditionPath.map((item) => item.name)).toEqual([])
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
      controller.setContent(context, '5px'); },
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
  const nextContent = { onCompile(context, controller) { nextContentCalls++; controller.setContent(context, '7px'); } }
  const source = { onCompile(context: JSSCompileContext, controller) { context.node.content = nextContent; controller.setContent(context, '3px'); } }
  const nextKey: JSSKeyObject & JSSContent = {
    onCompile(context, controller) { nextKeyCalls++; },
    toCSSString: () => '--next-key',
  }
  const sourceKey: JSSKeyObject & JSSContent = {
    onCompile(context, controller) { context.node.key = nextKey; },
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
  const original = { onCompile(context, controller) { calls.original++; controller.setContent(context, '1px'); } }
  const before = { onCompile(context, controller) { calls.before++; controller.setContent(context, '2px'); } }
  const after = { onCompile(context, controller) { calls.after++; controller.setContent(context, '4px'); } }
  const revised = { onCompile(context, controller) { calls.revised++; controller.setContent(context, calls.revised === 1 ? '5px' : '6px'); } }
  const newKey: JSSKeyObject & JSSContent = { onCompile(context, controller) { calls.key++; }, toCSSString: () => '--changed-key' }
  let changed = false
  const css = compileRules([
    [[], 'top', { onCompile(context, ast) {
      const future = ast.search({ key: 'width' })[0]
      future.content = before
      future.key = newKey
      ast.setContent(context, '0px'); } }],
    [[], 'width', original],
    [[], 'height', original],
    [[], 'margin', revised],
    [[], 'order', { onCompile(context, controller) { calls.stable++; controller.setContent(context, 1); } }],
    [[], 'bottom', { onCompile(context, ast) {
      if (!changed) {
        changed = true
        ast.search({ key: 'height' })[0].content = after
        ast.search({ key: 'margin' })[0].compileRevision++
      }
      ast.setContent(context, '0px'); } }],
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
  const oldContent = { onCompile(context, controller) { events.push('old-content'); controller.setContent(context, '1px'); } }
  const nextContent = { onCompile(context, controller) { events.push('next-content'); controller.setContent(context, '2px'); } }
  const oldKey: JSSKeyObject & JSSContent = { onCompile(context, controller) { events.push('old-key'); }, toCSSString: () => '--before-key' }
  const nextKey: JSSKeyObject & JSSContent = { onCompile(context, controller) { events.push('next-key'); }, toCSSString: () => '--before-next' }
  const afterKey: JSSKeyObject & JSSContent = { onCompile(context, controller) { events.push('after-key'); }, toCSSString: () => '--after-next' }
  const css = compileRules([
    [[], 'top', { compileWaveIndex: 1, onCompile(context, ast) {
      expect(events).toEqual(['old-key', 'old-content'])
      const cached = ast.search({ key: '--before-key' })[0]
      cached.key = nextKey
      cached.content = nextContent
      ast.setContent(context, '0px'); } }],
    [[], oldKey, oldContent],
    [[], '--after-key', '3px'],
    [[], 'bottom', { compileWaveIndex: 1, onCompile(context, ast) {
      expect(events).toEqual(['old-key', 'old-content', 'next-key', 'next-content'])
      ast.search({ key: '--after-key' })[0].key = afterKey
      ast.setContent(context, '0px'); } }],
  ])
  expect(events).toEqual(['old-key', 'old-content', 'next-key', 'next-content', 'after-key'])
  expect(css).toContain('--before-next: 2px;')
  expect(css).toContain('--after-next: 3px;')
  expect(css).not.toContain('--before-key:')
  expect(css).not.toContain('--after-key:')
})

test('普通节点编译完整保留全部声明及其顺序', () => {
  const source: Rules = Array.from({ length: 200 }, (_, index) => [[], `--membership-${index}`, index])
  expect(compileRules(source)).toBe(source.map((_, index) => `--membership-${index}: ${index};`).join('\n'))
})

test.each([20, 40])('按需资源完整输出，共享资源只激活及编译一次：%s', (count) => {
  let repeatedActivations = 0
  let resourceVisits = 0
  const source: Rules = []
  for (let index = 0; index < count; index++) {
    const resources: Rules = [[[condition('.AssociatedResources')], `--resource-${index}`, index]]
    source.push([[], `--consumer-${index}`, { onActive: () => resources }])
  }
  const repeated = {
    onActive() {
      repeatedActivations++
      return [[[condition('.RepeatedResource')], 'color', { onCompile(context, controller) { resourceVisits++; controller.setContent(context, 'blue'); } }]] as Rules
    },
  }
  source.push([[], 'width', repeated])
  source.push([[], 'height', { compileWaveIndex: 2, onCompile(context, controller) { controller.setContent(context, repeated); } }])
  const css = compileRules(source)
  for (let index = 0; index < count; index++) expect(css).toContain(`--resource-${index}: ${index};`)
  expect(css).toContain('.RepeatedResource {\ncolor: blue;')
  expect(repeatedActivations).toBe(1)
  expect(resourceVisits).toBe(1)
})

test('同一 Rule 身份的多个激活记录均关联最后产物，不将不同 Rule 当成获胜记录', () => {
  let visits = 0
  const sharedRule: Rules[0] = [[condition('.SharedRuleIdentity')], 'color', { onCompile(context, controller) { visits++; controller.setContent(context, 'blue'); } }]
  const first: JSSContent = { onActive: () => [sharedRule] }
  const other: JSSContent = { onActive: () => [[[condition('.SharedRuleIdentity')], 'color', 'red']] }
  const same: JSSContent = { onActive: () => [sharedRule] }
  const css = compileRules([
    [[], 'width', first], [[], 'height', other], [[], 'margin', same],
    [[], 'padding', { compileWaveIndex: 2, onCompile(context, controller) { controller.setContent(context, first); } }],
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
    [[], 'height', { compileWaveIndex: 1, onCompile(context, controller) {
      resources.push([[], 'color', 'red'])
      controller.setContent(context, content); } }],
  ])
  expect(css).toContain('color: red;')

  let oldVisits = 0
  let newVisits = 0
  const original: Rules[0] = [[condition('.ChangedActiveRules')], 'color', { onCompile(context, controller) { oldVisits++; controller.setContent(context, 'red'); } }]
  const replacement: Rules[0] = [[condition('.ChangedActiveRules')], 'color', { onCompile(context, controller) { newVisits++; controller.setContent(context, 'blue'); } }]
  const changed: Rules = [original]
  const active: JSSContent = { onActive: () => changed }
  const output = compileRules([
    [[], 'width', active],
    [[], 'height', { onCompile(context, controller) { changed.splice(0, 1, replacement); controller.setContent(context, active); } }],
    [[], 'margin', { compileWaveIndex: 2, onCompile(context, controller) { controller.setContent(context, active); } }],
  ])
  expect(output).toContain('color: blue;')
  expect(output).not.toContain('color: red;')
  expect(oldVisits).toBe(0)
  expect(newVisits).toBe(1)
})

test.each(['append', 'delete', 'replace'])('未再次消费的记录改写 Rules，生成时按当前身份关联：%s', (change) => {
  let originalVisits = 0
  let replacementVisits = 0
  const original: Rules[0] = [[condition('.CurrentActiveRules')], 'color', { onCompile(context, controller) { originalVisits++; controller.setContent(context, 'red'); } }]
  const replacement: Rules[0] = [[condition('.CurrentActiveRules')], 'color', { onCompile(context, controller) { replacementVisits++; controller.setContent(context, 'blue'); } }]
  const resources: Rules = change === 'append' ? [] : [original]
  const first: JSSContent = { onActive: () => resources }
  const winner: JSSContent = { onActive: () => [original] }
  const css = compileRules([
    [[], 'width', first],
    [[], 'height', winner],
    [[], 'margin', { onCompile(context, controller) {
      if (change === 'append') resources.push(original)
      else resources.splice(0, 1, ...(change === 'replace' ? [replacement] : []))

    } }],
    [[], 'padding', { compileWaveIndex: 2, onCompile(context, controller) {
      expect(originalVisits).toBe(1)
      if (change === 'delete') resources.push(replacement)
      controller.setContent(context, first); } }],
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
    onCompile(context: JSSCompileContext, ast: ASTController) { ast.onRemove(context.node, () => { cleanups++ }); ast.setContent(context, 'blue'); },
  }]] }
  const css = compileRules([
    [[], 'width', old],
    [[], 'height', shared],
    [[], 'margin', shared],
    [[], 'padding', { compileWaveIndex: 2, onCompile(context, ast) {
      ast.remove(ast.search({ key: 'width' })[0])
      ast.remove(ast.search({ key: 'height' })[0])
      if (!keepShared) ast.remove(ast.search({ key: 'margin' })[0])

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
    [[condition('.LifecycleOnly'), condition('&:where([data-wave-hover])')], 'display', lifecycleOnly],
  ])

  expect(activations).toBe(1)
  expect(observedContext?.conditionPath.targetConditionPath.map((item) => item.header)).toEqual(['.LifecycleOnly', '&:where([data-wave-hover])'])
  expect(observedContext?.conditionPath.stateConditionPath.map((item) => item.name)).toEqual([])
  expect(css).toContain('.LifecycleDependency')
  expect(css).toContain('color: red;')
  expect(css).not.toContain('display:')
  expect(() => compileRules([[[condition('.Invalid')], 'color', {}]])).toThrow('不是可编译的 CSS 内容')
})

test('只有子内容的对象等依赖完成后不输出当前声明', () => {
  let visits = 0
  const child: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) { visits++; controller.setContent(context, '9px'); } }
  const container: JSSContent = { dependencies: [child] }

  expect(compileRules([[[], 'width', container]])).toBe('')
  expect(visits).toBe(1)
})

test('设定的无输出容器保留未完成依赖，完成后才退出当前声明', () => {
  const events: string[] = []
  const child: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) {
    expect(events).toEqual(['source', 'middle'])
    events.push('child')
    controller.setContent(context, '9px'); } }
  const container: JSSContent = {
    dependencies: [child],
    onActive: () => [[[condition('.NoOutputResource')], 'color', 'red']],
  }
  const source: JSSContent = { onCompile(context, controller) { events.push('source'); controller.setContent(context, container); } }
  const middle: JSSContent = { compileWaveIndex: 1, onCompile(context, controller) { events.push('middle'); controller.setContent(context, 1); } }
  const css = compileRules([[[], 'width', source], [[], 'order', middle]])

  expect(events).toEqual(['source', 'middle', 'child'])
  expect(css).toContain('.NoOutputResource')
  expect(css).toContain('color: red;')
  expect(css).not.toContain('width:')
})

test('延后的动态依赖完成后输出 CSS，成功编译通知不重复', () => {
  let childCalls = 0
  const child: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) { childCalls++; controller.setContent(context, '9px'); } }
  const content: JSSContent = {
    get dependencies() { return [child] },
    toCSSString: (resolve) => resolve?.(child),
  }
  const css = compileRules([[[], 'width', content]])

  expect(css).toContain('width: 9px;')
  expect(childCalls).toBe(1)
})

test('Variable Content 根通知设定内容进入正式 CSS 输出', () => {
  const source = variable('red', { name: 'content-root-replacement' })
  const css = compileRules([[[condition('.ContentRootReplacement')], 'color', source]])

  expect(css).toContain('color: var(--content-root-replacement);')
})

test('Variable source 与状态中的可调用内容按对象编译而非工厂调用', () => {
  let sourceFactoryCalls = 0
  const source = Object.assign(() => {
    sourceFactoryCalls++
    return 'green'
  }, {
    [Unresultable]: true,
    onCompile(context, controller) {
      controller.setContent(context, 'red'); },
  })
  let stateFactoryCalls = 0
  const state = Object.assign(() => {
    stateFactoryCalls++
    return 'yellow'
  }, {
    [Unresultable]: true,
    onCompile(context, controller) {
      controller.setContent(context, 'blue'); },
  })
  const css = compileRules([[
    [condition('.CompilableFunction'), condition('&:where([data-wave-hover])')],
    'color',
    variable(source, { name: 'compilable-function-color', states: { contentWaveHover: state } }),
  ]])

  expect(sourceFactoryCalls).toBe(0)
  expect(stateFactoryCalls).toBe(0)
  expect(css).toContain('color: var(--compilable-function-color);')
  expect(css).toContain('--compilable-function-color: red;')
  expect(css).toContain('--compilable-function-color: blue;')
  expect(css).not.toContain('green')
  expect(css).not.toContain('yellow')
})
