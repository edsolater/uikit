import { token, type Token } from '../token'
/** 具体 Token 的资源依赖、声明顺序与本次 AST 的撤销效果。 */

import { describe, expect, test } from 'vitest'
import { whenSettled } from './when-settled'
import { parse, type AnyNode } from 'postcss'
import { compileRules } from '../css-root'
import { condition } from '../condition'
import type { JSSContent } from '../content'
import { declare } from '../operations/declare'
import { key } from '../key'
import { multiply } from '../pieces/contents/functions/calc'
import { appendStateCondition, resolveStateConditions } from '../pieces/state-conditions'
import type { Rules } from '../rule'
import * as styleSystem from '../index'
import { colorMix } from '../pieces/contents/functions/color-mix'

describe('具体定义消费与CSS同名层叠', () => {

  test('创建 Name、注册定义和保存配方不执行默认内容，也不发布资源', () => {
    const name = 'dormant-name'
    const source = token(() => { throw new Error('未消费不应执行默认内容') }, {
      name,
      onFirstScan: () => { throw new Error('未消费不应激活资源') },
      registration: { syntax: '<number>', inherits: true, initialValue: 0 },
    })
    token(multiply('var(--dormant-name)', 2), 'dormant-derived')
    expect(compileRules([])).toBe('')
    const css = compileRules([[['.Unrelated'], 'display', 'block']])
    expect(declarationsAt(css, ['.Unrelated'])).toEqual(['display: block;'])
    expect(css).not.toContain('dormant-')
  })



  test.each([false, true].flatMap(reverseRegistration => [false, true].map(reverseWriting => ({ reverseRegistration, reverseWriting }))))(
    '同级同名按书写顺序，显式声明保留CSS层叠：反向注册=$reverseRegistration，反向书写=$reverseWriting',
    ({ reverseRegistration, reverseWriting }) => {
      const name = 'name-tied'
      const first = reverseRegistration ? undefined : token('red', { name })
      const second = token('blue', { name: 'name-tied' })
      const red = first ?? token('red', { name })
      const candidates = reverseWriting ? [second, red] : [red, second]
      const rules: Rules = candidates.map(item => [['.Scope'], ...declare(item)])
      const named = compileRules([...rules, [['.Scope'], 'color', 'var(--name-tied)']])
      const concrete = compileRules([...rules, [['.Scope'], 'color', red]])
      expect(declarationsAt(named, ['.Scope'])).toEqual(declarationsAt(concrete, ['.Scope']))
      expect(declarationsAt(named, [':root'])).toEqual([])
      expect(declarationsAt(concrete, [':root'])).toContain('--name-tied: red;')
      expect(declarationsAt(named, ['.Scope'])).toEqual([
        `--name-tied: ${reverseWriting ? 'red' : 'blue'};`, 'color: var(--name-tied);',
      ])
    },
  )
})

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
    if (headers.length === path.length && headers.every((header, index) => (header === ':where(:root)' ? ':root' : header) === path[index]))
      lines.push(`${declaration.prop}: ${declaration.value.replace(/\s*([,*+()])\s*/g, '$1')};`)
  })
  return lines
}

/**
 * 通过现役 AST 编辑接口把直接声明放到真正的 StateCondition 地址，不伪造领域行为。
 */
function inPhase(target: Token, content: string): JSSContent {
  return { onCompile(context, controller) {
    controller.insert({ before: context.node, conditionPath: appendStateCondition(
      context.conditionPath, resolveStateConditions(['&[data-phase]'])[0],
    ) }, declare(target, content), { owner: context.node })
    controller.remove(context.node, { from: 'output' })
  } }
}

describe('实际引用与消费退出', () => {
  test('声明内容更新后，自身状态采用根据地的新基础', () => {
    const source = token(10, { name: 'declaration-revision', address: '.Revision', state: { '&[data-phase]': base => multiply(base, 2) } })
    const initial = declare(source, 7)
    const css = compileRules([
      [['.Revision'], ...initial], [['.Revision'], 'width', source],
      [[], undefined, whenSettled(controller => {
        const node = controller.search({ key: source }).find(node => node.content === initial[1])!
        node.content = declare(source, 8)[1]
        node.compileRevision++
        return true
      })],
    ])
    expect(css).toContain('--declaration-revision: 8;')
    expect(css).toContain('--declaration-revision: calc(8 * 2);')
    expect(css).not.toContain('--declaration-revision: 7;')
  })

  test.each([false, true])('消费内容换成另一Token后清理旧需求，仍共享旧来源=%s', shared => {
    const first = token(5, { name: 'replaced-consumer-first', address: '.Replacement', state: { hover: 6 }, onFirstScan: () => [[['.OldConsumerResource'], 'opacity', 0.5]], registration: { syntax: '<number>', inherits: true, initialValue: 1 } })
    const second = token(9, { name: 'replaced-consumer-second', address: '.Replacement', registration: { syntax: '<number>', inherits: true, initialValue: 2 } })
    const css = compileRules([
      [['.Replacement'], 'width', first],
      ...(shared ? [[['.Replacement'], 'height', first] as Rules[number]] : []),
      [[], undefined, whenSettled(controller => {
        const node = controller.search({ key: 'width' })[0]
        node.content = second
        node.compileRevision++
        return true
      })],
    ])
    expect(css).toContain('width: var(--replaced-consumer-second);')
    expect(css).toContain('--replaced-consumer-second: 9;')
    expect(css.includes('--replaced-consumer-first:')).toBe(shared)
    expect(css.includes('.OldConsumerResource')).toBe(shared)
    expect(css.includes('@property --replaced-consumer-first')).toBe(shared)
    expect(css).toContain('@property --replaced-consumer-second')
  })

  test.each(['改名', '移出根据地'])('原声明%s后，缺失的根据地恢复创建内容并保留新位置的值', change => {
    const size = token(5, { name: 'home-moved-before', address: '.MovedHome', state: { '&[data-phase]': '11px' } })
    const css = compileRules([
      [['.MovedHome'], '--home-moved-before', 9], [['.MovedHome'], 'width', size],
      [[], undefined, whenSettled(controller => {
        const node = controller.search({ key: '--home-moved-before' }).find(node =>
          node.content === 9)!
        if (change === '改名') node.key = '--home-moved-after'
        else node.conditionPath = { targetConditionPath: [condition('.MovedElsewhere')], stateConditionPath: [] }
        return true
      })],
    ])
    expect(declarationsAt(css, ['.MovedHome'])).toContain('--home-moved-before: 5;')
    expect(declarationsAt(css, change === '改名' ? ['.MovedHome'] : ['.MovedElsewhere']))
      .toContain(`${change === '改名' ? '--home-moved-after' : '--home-moved-before'}: 9;`)
    expect(declarationsAt(css, ['.MovedHome', '&[data-phase]'])).toEqual(['--home-moved-before: 11px;'])
    expect(declarationsAt(css, ['.MovedElsewhere', '&[data-phase]'])).toEqual([])
  })
  test('动画帧原生属性消费激活依赖，资源描述符不激活', () => {
    const source = token('5px', { name: 'dependency-frame-source' })
    const line = token(source, { name: 'dependency-frame-line' })
    const resource = compileRules([
      [['@property --descriptor'], 'initial-value', line],
      [['.Child'], ...declare(source, '7px')],
    ])
    expect(declarationsAt(resource, ['.Child'])).not.toContain('--dependency-frame-line: var(--dependency-frame-source);')
    const css = compileRules([
      [['@keyframes dependency-animation', 'to'], 'width', line],
      [['.Child'], ...declare(source, '7px')],
    ])
    expect(declarationsAt(css, [':root'])).toContain('--dependency-frame-line: var(--dependency-frame-source);')
  })

  test.each([false, true])('消费者撤销后共享需求=%s，下一会话不保留观察者', shared => {
    const source = token('red', { name: 'dependency-lifetime-source' })
    const line = token(source, { name: 'dependency-lifetime-line' })
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
    expect(css.includes('--dependency-lifetime-line: var(--dependency-lifetime-source);')).toBe(shared)
    expect(css).not.toContain('border-color:')
    const next = compileRules([[['.Child'], ...declare(source, 'blue')]])
    expect(next).not.toContain('--dependency-lifetime-line:')
    expect(next).toContain('--dependency-lifetime-source: blue;')
  })
})
