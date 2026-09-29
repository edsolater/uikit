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

test('正式 Rule 按波解析嵌套 Content，读取复合地址并把插入节点接回 Root 队列', () => {
  const parseWaves: number[] = []
  const nested = {
    contents: ['6px'],
    parseWaveIndex: 0,
    parse() {
      parseWaves.push(0)
      return value('6px')
    },
  }
  let observedController: ASTController | undefined
  const content = {
    contents: [nested],
    parseWaveIndex: 2,
    parse(controller: ASTController) {
      parseWaves.push(controller.parseWaveIndex)
      observedController = controller
      controller.insert(controller.conditionPath, key('--wave-inserted-value'), '9px')
      return value(createJSSContent((read) => {
        const input = read(nested)
        return input === undefined ? undefined : `calc(${input} * 2)`
      }, [nested]))
    },
  }
  let updatedInsertedNode = false
  const laterContent = {
    parseWaveIndex: 2,
    parse(controller: ASTController) {
      const inserted = controller.findByKey(key('--wave-inserted-value'))
      if (!inserted) throw new Error('后续解析对象没有观察到前序插入。')
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

  expect(parseWaves).toEqual([0, 2])
  expect(observedController?.conditionPath.targetConditionPath.map((item) => item.header)).toEqual(['.WaveContent'])
  expect(observedController?.conditionPath.stateConditionPath.map((item) => item.name)).toEqual(['contentWaveHover'])
  expect(observedController?.findByKey(key('color'))?.content).toBe('red')
  expect(updatedInsertedNode).toBe(true)
  expect(css).toContain('--wave-inserted-value: 11px;')
  expect(css).toContain('width: calc(6px * 2);')
  expect(content.contents[0]).toBe(nested)
  expect(nested.contents).toEqual(['6px'])
})

test('后续对象修改已解析的队列节点时，最终 parsed 读取最终队列内容', () => {
  const mutator = {
    parse(controller: ASTController) {
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

test('自定义 Key 只凭通用 parse 与输出能力插入节点', () => {
  let parseCalls = 0
  const customKey: JSSKeyObject & JSSContent = {
    toCSSString: () => '--custom-unparsed-key',
    parse(controller: ASTController) {
      parseCalls++
      controller.insert(controller.conditionPath, '--custom-key-dependency', '7px')
      return this
    },
  }
  const css = compileRules([[[condition('.CustomKey')], customKey, '5px']])

  expect(parseCalls).toBe(1)
  expect(css).toContain('--custom-key-dependency: 7px;')
  expect(css).toContain('--custom-unparsed-key: 5px;')
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
  expect(() => compileRules([[[condition('.Invalid')], 'color', {}]])).toThrow('不是可解析的 CSS 内容')
})

test('Variable Content 根 parse 返回值进入正式 CSS 输出', () => {
  const source = variable('red', { name: 'content-root-replacement' })
  const css = compileRules([[[condition('.ContentRootReplacement')], 'color', source]])

  expect(css).toContain('color: var(--content-root-replacement, red);')
})

test('Variable source 与状态中的可调用 Parseable 按对象解析而非工厂调用', () => {
  let sourceParseCalls = 0
  let sourceFactoryCalls = 0
  const source = Object.assign(() => {
    sourceFactoryCalls++
    return 'green'
  }, {
    [Unresultable]: true,
    parse() {
      sourceParseCalls++
      return 'red'
    },
  })
  let stateParseCalls = 0
  let stateFactoryCalls = 0
  const state = Object.assign(() => {
    stateFactoryCalls++
    return 'yellow'
  }, {
    [Unresultable]: true,
    parse() {
      stateParseCalls++
      return 'blue'
    },
  })
  const css = compileRules([[
    [condition('.ParseableFunction'), 'contentWaveHover'],
    'color',
    variable(source, { name: 'parseable-function-color', states: { contentWaveHover: state } }),
  ]])

  expect(sourceParseCalls).toBe(1)
  expect(sourceFactoryCalls).toBe(0)
  expect(stateParseCalls).toBe(1)
  expect(stateFactoryCalls).toBe(0)
  expect(css).toContain('color: var(--parseable-function-color, red);')
  expect(css).toContain('--parseable-function-color: blue;')
  expect(css).not.toContain('green')
  expect(css).not.toContain('yellow')
})
