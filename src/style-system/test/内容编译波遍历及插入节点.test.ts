/** 通过正式 Rules 入口验证 Content 次波、嵌套内容与节点插入。 */
import { expect, test } from 'vitest'
import { Unresultable } from '@edsolater/fnkit'
import { condition } from '../condition'
import { key } from '../key'
import { stateCondition } from '../pieces/state-conditions'
import { compileRules } from '../css-root'
import { createJSSContent } from '../content'
import { value } from '../value'
import { variable } from '../variable'
import { variableCluster } from '../variable-cluster'
import type { JSSCompileContext } from '../index'
import type { ASTController } from '../compiler/ast-controller'
import type { JSSKeyObject } from '../key'
import type { JSSContentContext, JSSContent } from '../content'
import type { Rules } from '../rule'

stateCondition('contentWaveHover', condition('&:where([data-wave-hover])'))

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

test('只提供 onActive 的内容生成按需 Rules，本声明不输出', () => {
  let activations = 0
  let observedContext: JSSContentContext | undefined
  const lifecycleOnly = {
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
