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
import type { ASTController } from '../compiler/ast-controller'
import type { JSSKeyObject } from '../key'
import type { JSSContentContext, JSSContent } from '../content'
import type { Rules } from '../rule'

stateCondition('contentWaveHover', condition('&:where([data-wave-hover])'))

test('正式 Rule 按编译波访问嵌套 Content，读取复合地址并把插入节点接回 Root 队列', () => {
  const compileWaves: number[] = []
  const nested = {
    dependencies: ['6px'],
    compileWaveIndex: 0,
    compile() {
      compileWaves.push(0)
      return value('6px')
    },
  }
  let observedController: ASTController | undefined
  const content = {
    dependencies: [nested],
    compileWaveIndex: 2,
    compile(controller: ASTController) {
      compileWaves.push(controller.compileWaveIndex)
      observedController = controller
      controller.insert(controller.conditionPath, key('--wave-inserted-value'), '9px')
      return value(createJSSContent((resolve) => {
        const input = resolve(nested)
        return input === undefined ? undefined : `calc(${input} * 2)`
      }, [nested]))
    },
  }
  let updatedInsertedNode = false
  const laterContent = {
    compileWaveIndex: 2,
    compile(controller: ASTController) {
      const inserted = controller.findByKey(key('--wave-inserted-value'))
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
  ])

  expect(compileWaves).toEqual([0, 2])
  expect(observedController?.conditionPath.targetConditionPath.map((item) => item.header)).toEqual(['.WaveContent'])
  expect(observedController?.conditionPath.stateConditionPath.map((item) => item.name)).toEqual(['contentWaveHover'])
  expect(observedController?.findByKey(key('color'))?.content).toBe('red')
  expect(updatedInsertedNode).toBe(true)
  expect(css).toContain('--wave-inserted-value: 11px;')
  expect(css).toContain('width: calc(6px * 2);')
  expect(content.dependencies[0]).toBe(nested)
  expect(nested.dependencies).toEqual(['6px'])
})

test('后续对象修改已编译的队列节点时，最终输出读取最终队列内容', () => {
  const mutator = {
    compile(controller: ASTController) {
      const existing = controller.findByKey(key('--audit-existing-node'))
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

test('自定义 Key 只凭通用 compile 与输出能力插入节点', () => {
  let compileCalls = 0
  const customKey: JSSKeyObject & JSSContent = {
    toCSSString: () => '--custom-compiled-key',
    compile(controller: ASTController) {
      compileCalls++
      controller.insert(controller.conditionPath, '--custom-key-dependency', '7px')
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

test('Variable Content 根 compile 返回值进入正式 CSS 输出', () => {
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
    compile() {
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
    compile() {
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
