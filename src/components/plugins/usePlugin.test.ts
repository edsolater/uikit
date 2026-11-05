/** 节点 Plugin 的配置、控制与清理。 */
// @vitest-environment jsdom
import { createRoot, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import {
  defineInactivePlugin,
  type PluginContext,
} from './defineInactivePlugin'
import { defineInactivePlugins } from './defineInactivePlugins'
import { usePlugin } from './usePlugin'

test('配置不执行核心；受控 Plugin 安装后提供控制并清理，可重挂', () => {
  createRoot((dispose) => {
    const cleanup = vi.fn()
    const core = vi.fn(
      ({
        pluginOptions: options,
        onCleanup,
      }: PluginContext & { pluginOptions: { value: number } }) => {
        onCleanup(cleanup)
        return { value: options.value }
      },
    )
    const inactive = defineInactivePlugin({ name: 'sample', pluginCore: core })
    const [plugin, controller] = usePlugin(inactive, { value: 3 })
    expect(core).not.toHaveBeenCalled()
    const cleanups: (() => void)[] = []
    const mount = () =>
      plugin({
        element: document.createElement('div'),
        onCleanup: (fn) => cleanups.push(fn),
        addProps: () => {},
      })
    mount()
    flush()
    expect(controller.value).toBe(3)
    expect(mount).toThrow('受控 Plugin sample 已安装到其他节点')
    cleanups.splice(0).forEach((fn) => fn())
    flush()
    expect(controller.value).toBeUndefined()
    expect(cleanup).toHaveBeenCalledOnce()
    mount()
    flush()
    expect(controller.value).toBe(3)
    cleanups.splice(0).forEach((fn) => fn())
    dispose()
  })
})

test('多元定义交出独立 raw 工厂，错误的配置和集合不能交给单元 usePlugin', () => {
  const group = defineInactivePlugins({
    draggable: ({
      pluginOptions,
    }: PluginContext & { pluginOptions: { payload: string } }) => ({
      payload: pluginOptions.payload,
    }),
    droppable: (
      {}: PluginContext & { pluginOptions: { disabled?: boolean } },
    ) => ({}),
  })
  const first = group.droppable()
  const second = group.droppable()
  expect(first).not.toBe(second)
  expect(
    first({
      element: document.createElement('div'),
      onCleanup: () => {},
      addProps: () => {},
    }),
  ).not.toBe(
    second({
      element: document.createElement('div'),
      onCleanup: () => {},
      addProps: () => {},
    }),
  )
  expect(
    first({
      element: document.createElement('div'),
      onCleanup: () => {},
      addProps: () => {},
    }),
  ).not.toBe(
    first({
      element: document.createElement('div'),
      onCleanup: () => {},
      addProps: () => {},
    }),
  )
  if (false) {
    // @ts-expect-error 必填配置不可省略。
    group.draggable()
    // @ts-expect-error 受控角色同样必须提供必填配置。
    usePlugin(group.draggable)
    const [, controller] = usePlugin(group.draggable, { payload: '材料' })
    controller.payload?.toUpperCase()
    // @ts-expect-error 不存在的控制成员不可访问。
    controller.unrelated
    // @ts-expect-error 多元集合不属于单元 hook 输入。
    usePlugin(group)
    defineInactivePlugins({
      // @ts-expect-error 配置必须是对象。
      bad: ({}: PluginContext & { pluginOptions: string }) => ({}),
    })
  }
})

test('安装失败释放已登记资源，受控 Plugin 可以再次安装', () => {
  createRoot((dispose) => {
    const resource = vi.fn()
    let fail = true
    const inactive = defineInactivePlugin({
      name: 'retry',
      pluginCore({ onCleanup }) {
        onCleanup(resource)
        if (fail) throw new Error('安装失败')
        return { ready: true }
      },
    })
    const [plugin, controller] = usePlugin(inactive)
    const cleanups: (() => void)[] = []
    const mount = () =>
      plugin({
        element: document.createElement('div'),
        onCleanup: (cleanup) => cleanups.push(cleanup),
        addProps: () => {},
      })
    expect(mount).toThrow('安装失败')
    expect(resource).toHaveBeenCalledOnce()
    expect(controller.ready).toBeUndefined()
    fail = false
    mount()
    flush()
    expect(controller.ready).toBe(true)
    cleanups.forEach((cleanup) => cleanup())
    dispose()
  })
})
