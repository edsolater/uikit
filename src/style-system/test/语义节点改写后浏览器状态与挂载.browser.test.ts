/** 在浏览器验证改写节点的状态生效、原生层叠和挂载失败边界。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { key } from '../css-key'
import { rule, type RewriteRuleContent, type RulesHandle } from '../rule'
import { cssRoot } from '../css-root'

let style: HTMLStyleElement
let element: HTMLButtonElement
let handles: RulesHandle[]

beforeEach(() => {
  style = document.createElement('style')
  style.id = 'css-root'
  style.textContent = '.existing { color: red; }'
  document.head.append(style)
  element = document.createElement('button')
  element.className = 'ast-node'
  element.textContent = '状态验证'
  document.body.append(element)
  handles = []
})

afterEach(() => {
  for (const handle of handles) handle.remove()
  element.remove()
  style.remove()
})

test('改写后的状态声明实时生效，普通同名无效后值仍按浏览器层叠处理', async () => {
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index, node) {
      nodes.splice(index, 0, {
        kind: 'content', conditionPath: node.conditionPath, stateConditionPath: node.stateConditionPath,
        key: key('color'), value: { toCSSString: () => 'blue' },
      })
    },
  }
  handles.push(rule('.ast-node', 'color', 'red'))
  handles.push(rule('.ast-node', 'color', 'not-a-color'))
  handles.push(rule(['.ast-node', 'hover'], undefined, rewrite))
  cssRoot.mount()
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
  await userEvent.hover(element)
  expect(getComputedStyle(element).color).toBe('rgb(0, 0, 255)')
  expect(style.textContent).toContain('color: not-a-color;')
  expect(style.textContent).toContain('.existing')
})

test('特殊节点残留导致编译失败时保留上次成功提交', () => {
  handles.push(rule('.ast-node', 'color', 'red'))
  cssRoot.mount()
  const before = style.textContent
  const generated: RewriteRuleContent = { rewriteStyleNodes() { throw new Error('不应执行新节点。') } }
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index, node) {
      nodes.splice(index, 0, { ...node, value: generated })
    },
  }
  handles.push(rule('.ast-node', undefined, rewrite))
  expect(() => cssRoot.mount()).toThrow('仍有特殊节点')
  expect(style.textContent).toBe(before)
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
})
