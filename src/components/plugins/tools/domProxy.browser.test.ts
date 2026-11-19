import { createRoot } from 'solid-js'
import { render } from '@solidjs/web'
import { expect, test, vi } from 'vitest'
import { createComponent } from '@/foundation/render'
import { Piv } from '@/components/Piv/Piv'
import { isPromiseResultProxy } from '@edsolater/fnkit'
import {
  createInactivePlugin,
  type PluginCoreContext,
} from './createInactivePlugin'
import { createInactivePlugins } from './createInactivePlugins'

test('同步读取时准备一次代理，节点接入后执行此前的命令', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const focus = vi.spyOn(HTMLElement.prototype, 'focus')
  let unmount = () => {}
  let release = () => {}
  try {
    const capability = createRoot(dispose => {
      release = dispose
      return createInactivePlugin({
        name: 'domProxy',
        pluginCore(context) {
          const first = context.domProxy
          const second = context.domProxy
          context.addProps({ htmlProps: { tabIndex: 0 } })
          return { first, second, focus: () => first.focus() }
        },
      })()
    })
    expect(capability.controller.first).toBe(capability.controller.second)
    expect(isPromiseResultProxy(capability.controller.first)).toBe(true)
    const pending = capability.controller.focus()
    expect(focus).not.toHaveBeenCalled()
    unmount = render(() => createComponent(Piv, { is: capability }), host)
    await pending
    await pending
    expect(focus).toHaveBeenCalledOnce()
    expect(focus.mock.instances[0]).toBe(host.firstElementChild)
    expect(document.activeElement).toBe(host.firstElementChild)
  } finally {
    unmount()
    release()
    focus.mockRestore()
    host.remove()
  }
})

const exposeDom = createInactivePlugin({
  name: 'readiness',
  pluginCore: ({ domProxy }) => ({ dom: domProxy }),
})

test('插件作用域退出后才首次读取代理，就绪查询返回 false', async () => {
  const deferred = createInactivePlugin({
    name: 'deferred',
    pluginCore: context => ({ getDom: () => context.domProxy }),
  })
  const { controller, release } = createRoot(release => ({
    controller: deferred().controller,
    release,
  }))
  release()
  expect(await controller.getDom().isReady()).toBe(false)
})

test('代理先交付未连接的原节点，isReady 等到节点进入指定影子根', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const shadow = host.attachShadow({ mode: 'closed' })
  const staging = document.createElement('div')
  const { capability, release } = createRoot(release => ({
    capability: exposeDom(),
    release,
  }))
  const dom = capability.controller.dom
  const ready = dom.isReady(shadow)
  let settled = false
  void ready.then(() => {
    settled = true
  })
  const unmount = render(
    () => createComponent(Piv, { is: capability }),
    staging,
  )
  try {
    const element = await dom
    expect(element).toBe(staging.firstElementChild)
    expect(element.isConnected).toBe(false)
    expect(isPromiseResultProxy(dom)).toBe(true)
    await new Promise(requestAnimationFrame)
    expect(settled).toBe(false)
    shadow.append(staging)
    expect(await ready).toBe(true)
    expect(await dom).toBe(element)
    expect('isReady' in element).toBe(false)
  } finally {
    unmount()
    release()
    host.remove()
  }
})

for (const delivered of [false, true]) {
  test(`节点${delivered ? '已交付未连接' : '尚未交付'}时退出作用域，待就绪请求返回 false`, async () => {
    const host = document.createElement('div')
    const { capability, release } = createRoot(release => ({
      capability: exposeDom(),
      release,
    }))
    const dom = capability.controller.dom
    const ready = dom.isReady()
    const unmount = delivered
      ? render(() => createComponent(Piv, { is: capability }), host)
      : undefined
    try {
      if (delivered) expect(await dom).toBe(host.firstElementChild)
      await new Promise(requestAnimationFrame)
      release()
      expect(await ready).toBe(false)
    } finally {
      unmount?.()
      host.remove()
    }
  })
}

test('组合角色未读取 domProxy 时不准备；读取后保持角色间独立', () => {
  createRoot(dispose => {
    const group = createInactivePlugins({
      unused: (_context: PluginCoreContext<Record<string, never>>) => ({}),
      first: (context: PluginCoreContext<Record<string, never>>) => ({
        proxy: context.domProxy,
      }),
      second: (context: PluginCoreContext<Record<string, never>>) => ({
        proxy: context.domProxy,
      }),
    })
    const result = group()
    expect(result.plugins.unused.plugin.shadowProps).toEqual([])
    expect(result.plugins.first.plugin.shadowProps).toHaveLength(1)
    expect(result.plugins.second.plugin.shadowProps).toHaveLength(1)
    expect(result.controller.first.proxy).not.toBe(
      result.controller.second.proxy,
    )
    dispose()
  })
})
