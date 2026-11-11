/**
 * Piv 条件显隐的浏览器行为测试。
 *
 * 验证节点延迟创建、同一节点恢复、隐藏期间更新和最终资源清理。
 *
 * 确保显隐不改变布局或中断已取得的节点控制。
 */
import { flush, onCleanup } from 'solid-js'
import { render } from '@solidjs/web'
import { afterEach, expect, test, vi } from 'vitest'
import { createState, For, Show, val } from '@/foundation'
import { Piv } from '../Piv'
import { createInactivePlugin } from '@/components/plugins/tools/createInactivePlugin'

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  document.body.replaceChildren()
})

test('父级分支卸载时清理隐藏节点，应用存活且旧节点不会恢复', () => {
  const mounted = createState(true)
  const visible = createState(true)
  const detached = vi.fn()
  const childDisposed = vi.fn()
  const host = document.body.appendChild(document.createElement('main'))
  const Child = () => {
    onCleanup(childDisposed)
    return <span>内容</span>
  }
  dispose = render(() => <>
    <div data-app="alive">应用仍在</div>
    <Show when={val(mounted)}>
      <Piv if={visible} domRef={() => detached}><Child /></Piv>
    </Show>
  </>, host)
  const sentinel = host.querySelector('[data-app]')!
  const element = host.querySelector('span')!.parentElement!

  visible.set(false)
  flush()
  expect(element.isConnected).toBe(false)
  visible.set(true)
  flush()
  expect(host.querySelector('span')!.parentElement).toBe(element)
  visible.set(false)
  flush()
  expect(detached).not.toHaveBeenCalled()
  expect(childDisposed).not.toHaveBeenCalled()

  mounted.set(false)
  flush()
  expect(sentinel.isConnected).toBe(true)
  expect(detached).toHaveBeenCalledTimes(1)
  expect(childDisposed).toHaveBeenCalledTimes(1)
  visible.set(true)
  flush()
  expect(element.isConnected).toBe(false)
  expect(host.querySelector('span')).toBeNull()
  expect(detached).toHaveBeenCalledTimes(1)
  expect(childDisposed).toHaveBeenCalledTimes(1)
})

test('列表重排时显隐节点跟随数据项，隐藏后重排再显示仍保持身份', () => {
  const a = { name: 'A' }
  const b = { name: 'B' }
  const items = createState([a, b])
  const visible = createState(true)
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => <For each={val(items)}>{item =>
    <Piv if={visible} htmlProps={{ 'data-name': item.name }}>{item.name}</Piv>
  }</For>, host)
  const first = host.querySelector('[data-name="A"]')!
  const second = host.querySelector('[data-name="B"]')!
  expect([...host.children]).toEqual([first, second])

  items.set([b, a])
  flush()
  expect([...host.children]).toEqual([second, first])
  visible.set(false)
  flush()
  expect(host.childElementCount).toBe(0)
  items.set([a, b])
  flush()
  visible.set(true)
  flush()
  expect([...host.children]).toEqual([first, second])
  expect(first.textContent).toBe('A')
  expect(second.textContent).toBe('B')

  dispose()
  dispose = undefined
  expect(host.childElementCount).toBe(0)
  expect(first.isConnected).toBe(false)
  expect(second.isConnected).toBe(false)
})

test('条件显隐保留同一节点、响应更新和资源，卸载时清理一次', async () => {
  const visible = createState(false)
  const text = createState('初始')
  const attached = vi.fn()
  const detached = vi.fn()
  const childCreated = vi.fn()
  const childDisposed = vi.fn()
  const host = document.body.appendChild(document.createElement('main'))
  host.style.cssText = 'display:flex;gap:10px;align-items:flex-start'
  const capability = createInactivePlugin({
    name: 'visibility-test',
    pluginCore({ domProxy }) { return { domProxy } },
  })
  let proxy!: ReturnType<typeof capability>['controller']['domProxy']
  const Child = () => {
    childCreated()
    onCleanup(childDisposed)
    return <span>{val(text)}</span>
  }
  dispose = render(() => {
    const instance = capability()
    proxy = instance.controller.domProxy
    return <>
      <div style={{ width: '20px', height: '20px' }}>前</div>
      <Piv as="div" if={visible} is={instance} htmlProps={{ 'data-state': val(text) }} domRef={(element) => {
        attached(element)
        return detached
      }}>
        <input />
        <Child />
      </Piv>
      <div style={{ width: '20px', height: '20px' }}>后</div>
    </>
  }, host)

  expect(host.childElementCount).toBe(2)
  expect(attached).not.toHaveBeenCalled()
  expect(childCreated).not.toHaveBeenCalled()
  const before = host.children[0] as HTMLElement
  const after = host.children[1] as HTMLElement
  expect(after.getBoundingClientRect().left - before.getBoundingClientRect().right).toBe(10)

  visible.set(true)
  flush()
  const element = host.children[1] as HTMLElement
  expect(host.childElementCount).toBe(3)
  expect(attached).toHaveBeenCalledExactlyOnceWith(element)
  expect(childCreated).toHaveBeenCalledTimes(1)
  expect(await proxy).toBe(element)
  const input = element.querySelector('input')!
  input.value = '用户输入'

  visible.set(false)
  flush()
  expect(element.isConnected).toBe(false)
  expect(host.childElementCount).toBe(2)
  expect(after.getBoundingClientRect().left - before.getBoundingClientRect().right).toBe(10)
  expect(detached).not.toHaveBeenCalled()
  expect(childDisposed).not.toHaveBeenCalled()
  text.set('隐藏期间更新')
  flush()
  expect(element.dataset.state).toBe('隐藏期间更新')
  expect(element.querySelector('span')?.textContent).toBe('隐藏期间更新')
  ;(await proxy).setAttribute('data-proxy', '可控制')

  visible.set(true)
  flush()
  expect(host.childElementCount).toBe(3)
  expect(host.children[0]).toBe(before)
  expect(host.children[1]).toBe(element)
  expect(host.children[2]).toBe(after)
  expect(element.isConnected).toBe(true)
  expect(input.value).toBe('用户输入')
  expect(element.dataset.proxy).toBe('可控制')
  expect(attached).toHaveBeenCalledTimes(1)
  expect(childCreated).toHaveBeenCalledTimes(1)

  visible.set(false)
  flush()
  expect(detached).not.toHaveBeenCalled()
  expect(childDisposed).not.toHaveBeenCalled()
  dispose()
  dispose = undefined
  expect(detached).toHaveBeenCalledTimes(1)
  expect(childDisposed).toHaveBeenCalledTimes(1)
})
