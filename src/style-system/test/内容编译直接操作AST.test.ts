/** 内容自身处理当前操作；后续内容由普通编译队列推进。 */
import { expect, it } from 'vitest'
import { condition, createJSSContent, value, variable } from '../index'
import { compileRules } from '../css-root'
import type { JSSContent } from '../index'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'
import type { JSSKeyObject } from '../key'

it('当前操作立即改写，产物中的按需规则继续独立编译', () => {
  const path = condition('.rewriter-test')
  const events: string[] = []
  function operation(amount: number): JSSContent {
    return { onCompile(context, controller) {
      events.push(`rewrite-${amount}`)
      const content = amount === 1
        ? value('1', { onActive: () => [[[path], 'height', operation(2)]] })
        : createJSSContent((resolve) => `calc(${resolve(2)} * 3px)`, [2])
      controller.insert({ before: context.node, conditionPath: context.conditionPath }, [amount === 1 ? 'opacity' : 'height', content], { owner: context.node, identity: 'output' })
      return undefined
    } }
  }
  const unrelated: JSSContent = { onCompile() { events.push('unrelated'); return '1' } }
  const input: Parameters<typeof compileRules>[0] = [[[path], 'opacity', operation(1)], [[path], 'order', unrelated]]
  const css = compileRules(input)
  expect(events).toEqual(['rewrite-1', 'unrelated', 'rewrite-2'])
  expect(css).toContain('opacity: 1')
  expect(css).toContain('height: calc(2 * 3px)')
  expect(compileRules(input)).toBe(css)
})

it('即时改写可删除当前节点，不保留全局提交集等待收口', () => {
  const path = condition('.rewriter-removal')
  let visits = 0
  const content: JSSContent = { onCompile(context, controller) { visits++; controller.remove(context.node); return undefined } }
  expect(compileRules([[[path], 'opacity', content]])).toBe('')
  expect(visits).toBe(1)
})

it('删除首次消费位置不会撤销另一消费者共享的一次性注册产物', () => {
  const path = condition('.shared-registration')
  const registered = variable(1, { name: 'shared-registration', registration: { syntax: '<number>', inherits: false, initialValue: 1 } })
  const first: JSSContent = { onCompile(context, controller) {
    const target = context.node
    return value(registered, { onActive: () => [[[path], 'display', { onCompile(_context, next) { next.remove(target); return undefined } }]] })
  } }
  const css = compileRules([[[path], 'z-index', first], [[path], 'order', registered]])
  expect(css).toContain('@property --shared-registration')
  expect(css).toContain('order: var(--shared-registration, 1)')
  expect(css).not.toContain('z-index:')
})

it('同名不同对象首次消费替换注册，旧对象再次消费不反向覆盖', () => {
  const first = variable(1, { name: 'registration-order', registration: { syntax: '<number>', inherits: false } })
  const second = variable('red', { name: 'registration-order', registration: { syntax: '<color>', inherits: true } })
  const css = compileRules([[[], 'width', first], [[], 'color', second], [[], 'height', first]])
  expect(css).toContain('syntax: "<color>"')
  expect(css).toContain('inherits: true')
  expect(css).not.toContain('syntax: "<number>"')
})

it('同名资源替换后旧对象所有消费者撤销，再消费可重新注册', () => {
  const first = variable(1, { name: 'registration-restart', registration: { syntax: '<number>', inherits: false } })
  const second = variable('red', { name: 'registration-restart', registration: { syntax: '<color>', inherits: true } })
  const remove: JSSContent = { onCompile(context, controller) {
    controller.remove(controller.search({ key: 'width' })[0])
    controller.remove(controller.search({ key: 'height' })[0])
    controller.insert({ before: context.node, conditionPath: context.conditionPath }, ['opacity', first], { owner: context.node })
    return undefined
  } }
  const css = compileRules([[[], 'width', first], [[], 'color', second], [[], 'height', first], [[], 'display', remove]])
  expect(css).toContain('syntax: "<number>"')
  expect(css).toContain('inherits: false')
  expect(css).not.toContain('syntax: "<color>"')
})

it.each([false, true])('同波删除消费者不会产生孤儿资源，共享消费者=%s', (shared) => {
  const path = condition('.pending-owner')
  const dependency = value('1px', { onActive: () => [[[condition('.pending-resource')], 'color', 'red']] })
  const removeFirst: JSSContent = { onCompile(context, controller) {
    const first = controller.search({ key: 'width' })[0]!
    controller.remove(first)
    return undefined
  } }
  const input: Parameters<typeof compileRules>[0] = [[[path], 'width', dependency]]
  if (shared) input.push([[path], 'height', dependency])
  input.push([[path], 'display', removeFirst])
  const css = compileRules(input)
  expect(css.includes('.pending-resource')).toBe(shared)
})

it('已暂缓节点收到显式重访后，继续编译而不误报无进展', () => {
  const path = condition('.deferred-revisit')
  let ready = false
  const first: JSSContent = { onCompile(context, controller) {
    if (!ready) { controller.defer(context.node, '等待前提'); return undefined }
    return '1px'
  } }
  const second: JSSContent = { onCompile(context, controller) {
    ready = true
    controller.search({ key: 'width' }).find(node => node.content === first)!.compileRevision++
    return '2px'
  } }
  const css = compileRules([[[path], 'width', first], [[path], 'height', second]])
  expect(css).toContain('width: 1px')
  expect(css).toContain('height: 2px')
})

it('声明目标暂缓后等待下一波重试，不因本波返回自身就提前完成', () => {
  const path = condition('.deferred-key')
  let visits = 0
  const target: JSSKeyObject & JSSContent = {
    toCSSString: () => 'width',
    onCompile(context, controller) {
      visits++
      if (visits === 1) {
        controller.insert({ before: context.node, conditionPath: context.conditionPath }, ['height', '2px'], { owner: context.node })
        controller.defer(context.node, '等待下一波目标')
      }
      return target
    },
  }
  const css = compileRules([[[path], target, '1px']])
  expect(visits).toBe(2)
  expect(css).toContain('width: 1px')
  expect(css).toContain('height: 2px')
})

it('声明目标暂缓且没有进展时报告原因', () => {
  const target: JSSKeyObject & JSSContent = {
    toCSSString: () => 'width',
    onCompile(context, controller) { controller.defer(context.node, '目标没有前提'); return target },
  }
  expect(() => compileRules([[[], target, '1px']])).toThrow('目标没有前提')
})

it('展开入口脱离输出后仍保留来源链，撤销祖先时产物一并撤销', () => {
  const path = condition('.detached-source')
  let original: JSSStyleNode
  const child: JSSContent = { onCompile(context, controller) {
    controller.insert({ before: context.node, conditionPath: context.conditionPath }, ['width', '3px'], { owner: context.node })
    controller.remove(context.node, { from: 'output' })
    return undefined
  } }
  const source: JSSContent = { onCompile(context, controller) {
    original = context.node
    controller.insert({ before: context.node, conditionPath: context.conditionPath }, ['height', child], { owner: context.node })
    return undefined
  } }
  const removal = value('1', { onActive: () => [[[path], 'display', { onCompile(context, controller) { controller.remove(original); return undefined } }]] })
  const css = compileRules([[[path], 'opacity', source], [[path], 'order', removal]])
  expect(css).not.toContain('width:')
  expect(css).toContain('order: 1')
})


it.each(['output', 'session'])('当前位置退出后不再出现在查询结果中：%s', (from) => {
  const path = condition('.missing-position')
  const content: JSSContent = { onCompile(context, controller) {
    controller.remove(context.node, from === 'output' ? { from: 'output' } : undefined)
    expect(controller.search({ key: 'height' })).toEqual([])
    return undefined
  } }
  compileRules([[[path], 'width', '1px'], [[path], 'height', content], [[path], 'opacity', 1]])
})
