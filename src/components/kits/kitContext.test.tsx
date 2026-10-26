// @vitest-environment jsdom

import { createRoot } from 'solid-js'
import { render } from '@solidjs/web'
import { expect, test } from 'vitest'
import { useContext } from '@/foundation'
import {
  KitContext,
  KitContextRoot,
  useKitContext,
  type KitContextNode,
} from './kitContext'

test('App 提供的节点就是根，后代可读取最近上下文及指定祖先', () => {
  const host = document.createElement('div')
  const outer = { title: '外层' }
  const inner = { description: '内层' }
  let rootNode: KitContextNode
  function RootConsumer() {
    expect(useContext(KitContextRoot)).toBe(rootNode)
    expect(useKitContext()).toBeUndefined()
    expect(useKitContext({ target: 'Missing' })).toBeUndefined()
    expect(useKitContext({ payloadKey: 'title' })).toBeUndefined()
    return (
      <KitContext name="Outer" payloads={outer}>
        <KitContext name="Inner" payloads={inner}>
          <Consumer />
        </KitContext>
      </KitContext>
    )
  }
  function Consumer() {
    expect(useKitContext()).toBe(inner)
    expect(useKitContext({ target: 'Outer' })).toBe(outer)
    expect(useKitContext({ payloadKey: 'title' })).toBe(outer)
    expect(useKitContext({ target: 'Missing' })).toBeUndefined()
    const node = useContext(KitContextRoot)
    expect(node.isRoot).toBe(false)
    if (!node.isRoot && !node.parent.isRoot) {
      expect(node.parent.parent).toBe(rootNode)
    } else {
      throw new Error('子节点必须直接连接其具名父级与 App 根')
    }
    return <span>已读取祖先</span>
  }
  const dispose = render(() => {
    rootNode = { isRoot: true }
    return (
      <KitContextRoot value={rootNode}>
        <RootConsumer />
      </KitContextRoot>
    )
  }, host)
  try {
    expect(host.textContent).toBe('已读取祖先')
  } finally {
    dispose()
  }
})

test('独立 App 根不共享节点，缺少提供者按原生契约报错', () => {
  const roots: KitContextNode[] = []
  const disposers: Array<() => void> = []
  try {
    for (let index = 0; index < 2; index++) {
      function Consumer() {
        roots.push(useContext(KitContextRoot))
        return <span>独立应用</span>
      }
      disposers.push(
        render(() => {
          const rootNode: KitContextNode = { isRoot: true }
          return (
            <KitContextRoot value={rootNode}>
              <Consumer />
            </KitContextRoot>
          )
        }, document.createElement('div')),
      )
    }
    expect(roots).toHaveLength(2)
    expect(roots[0]).not.toBe(roots[1])
    createRoot((dispose) => {
      try {
        expect(() => useKitContext()).toThrow()
      } finally {
        dispose()
      }
    })
  } finally {
    disposers.forEach((dispose) => dispose())
  }
})
