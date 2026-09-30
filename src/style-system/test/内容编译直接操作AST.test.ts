/** 内容自身处理当前操作；后续内容由普通编译队列推进。 */
import { expect, it } from 'vitest'
import { condition, createJSSContent, value, variable } from '../index'
import { compileRules } from '../css-root'
import type { JSSContent } from '../index'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'

it('当前操作立即改写，产物中的按需规则继续独立编译', () => {
  const path = condition('.rewriter-test')
  const events: string[] = []
  function operation(amount: number): JSSContent {
    return { compile(controller) {
      events.push(`rewrite-${amount}`)
      const content = amount === 1
        ? value('1', { onActive: () => [[[path], 'height', operation(2)]] })
        : createJSSContent((resolve) => `calc(${resolve(2)} * 3px)`, [2])
      controller.insertAt(controller.node, 'output', controller.conditionPath, amount === 1 ? 'opacity' : 'height', content)
      return undefined
    } }
  }
  const unrelated: JSSContent = { compile() { events.push('unrelated'); return '1' } }
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
  const content: JSSContent = { compile(controller) { visits++; controller.removeNode(controller.node); return undefined } }
  expect(compileRules([[[path], 'opacity', content]])).toBe('')
  expect(visits).toBe(1)
})

it('删除首次消费位置不会撤销另一消费者共享的一次性注册产物', () => {
  const path = condition('.shared-registration')
  const registered = variable(1, { name: 'shared-registration', registration: { syntax: '<number>', inherits: false, initialValue: 1 } })
  const first: JSSContent = { compile(controller) {
    const target = controller.node
    return value(registered, { onActive: () => [[[path], 'display', { compile(next) { next.removeNode(target); return undefined } }]] })
  } }
  const css = compileRules([[[path], 'z-index', first], [[path], 'order', registered]])
  expect(css).toContain('@property --shared-registration')
  expect(css).toContain('order: var(--shared-registration, 1)')
  expect(css).not.toContain('z-index:')
})

it.each([false, true])('同波删除消费者不会产生孤儿资源，共享消费者=%s', (shared) => {
  const path = condition('.pending-owner')
  const dependency = value('1px', { onActive: () => [[[condition('.pending-resource')], 'color', 'red']] })
  const removeFirst: JSSContent = { compile(controller) {
    const first = controller.nodes().find(node => node.key === 'width')!
    controller.removeNode(first)
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
  const first: JSSContent = { compile(controller) {
    if (!ready) { controller.defer('等待前提'); return undefined }
    return '1px'
  } }
  const second: JSSContent = { compile(controller) {
    ready = true
    controller.revisit(controller.nodes().find(node => node.content === first)!)
    return '2px'
  } }
  const css = compileRules([[[path], 'width', first], [[path], 'height', second]])
  expect(css).toContain('width: 1px')
  expect(css).toContain('height: 2px')
})

it('展开入口脱离输出后仍保留来源链，撤销祖先时产物一并撤销', () => {
  const path = condition('.detached-source')
  let original: JSSStyleNode
  const child: JSSContent = { compile(controller) {
    controller.insert(controller.conditionPath, 'width', '3px')
    controller.detach()
    return undefined
  } }
  const source: JSSContent = { compile(controller) {
    original = controller.node
    controller.insert(controller.conditionPath, 'height', child)
    return undefined
  } }
  const removal = value('1', { onActive: () => [[[path], 'display', { compile(controller) { controller.removeNode(original); return undefined } }]] })
  const css = compileRules([[[path], 'opacity', source], [[path], 'order', removal]])
  expect(css).not.toContain('width:')
  expect(css).toContain('order: 1')
})


it.each(['detach', 'removeNode'] as const)('当前位置已退出队列时不返回其他节点作为邻居：%s', (action) => {
  const path = condition('.missing-position')
  const content: JSSContent = { compile(controller) {
    if (action === 'detach') controller.detach()
    else controller.removeNode(controller.node)
    expect(controller.neighbors(() => true)).toEqual({})
    return undefined
  } }
  compileRules([[[path], 'width', '1px'], [[path], 'height', content], [[path], 'opacity', 1]])
})
