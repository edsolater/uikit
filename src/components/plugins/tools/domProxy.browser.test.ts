import { createRoot } from 'solid-js'
import { render } from '@solidjs/web'
import { expect, test, vi } from 'vitest'
import { createComponent } from '@/foundation/render'
import { Piv } from '@/components/Piv/Piv'
import { isPromiseResultProxy } from '@edsolater/fnkit'
import {
  defineInactivePlugin,
  type PluginCoreContext,
} from './defineInactivePlugin'
import { defineInactivePlugins } from './defineInactivePlugins'

test('同步读取时准备一次代理，节点接入后执行此前的命令', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const focus = vi.spyOn(HTMLElement.prototype, 'focus')
  let unmount = () => {}
  let release = () => {}
  try {
    const capability = createRoot((dispose) => {
      release = dispose
      return defineInactivePlugin({
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

test('组合角色未读取 domProxy 时不准备；读取后保持角色间独立', () => {
  createRoot((dispose) => {
    const group = defineInactivePlugins({
      unused: (_context: PluginCoreContext<Record<string, never>>) => ({}),
      first: (context: PluginCoreContext<Record<string, never>>) => ({
        proxy: context.domProxy,
      }),
      second: (context: PluginCoreContext<Record<string, never>>) => ({
        proxy: context.domProxy,
      }),
    })
    const result = group()
    expect(result.unused.plugin.shadowProps).toEqual([])
    expect(result.first.plugin.shadowProps).toHaveLength(1)
    expect(result.second.plugin.shadowProps).toHaveLength(1)
    expect(result.first.controller.proxy).not.toBe(
      result.second.controller.proxy,
    )
    dispose()
  })
})
