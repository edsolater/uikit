/** 单元 Plugin 的构建、声明提交与输入识别。 */
// @vitest-environment jsdom
import { createRoot } from 'solid-js'
import { render } from '@solidjs/web'
import { createComponent } from '@/foundation/render'
import { Piv } from '@/components/Piv/Piv'
import { expect, test, vi } from 'vitest'
import {
  defineInactivePlugin,
  isPlugin,
  pluginMarker,
  readPlugin,
} from './defineInactivePlugin'

test('定义不运行 core；每次配置构建运行一次 core 并返回完整结果', () => {
  createRoot((dispose) => {
    const core = vi.fn(
      ({ pluginOptions }: { pluginOptions: { value: number } }) => ({
        value: pluginOptions.value,
      }),
    )
    const inactive = defineInactivePlugin({ name: 'sample', pluginCore: core })
    expect(core).not.toHaveBeenCalled()

    const first = inactive({ value: 3 })
    expect(core).toHaveBeenCalledOnce()
    expect(first.controller.value).toBe(3)
    expect(isPlugin(first.plugin)).toBe(true)
    expect(first.plugin[pluginMarker]).toBe('sample')

    const host = document.createElement('div')
    const unmount = render(() => createComponent(Piv, { is: first }), host)
    expect(core).toHaveBeenCalledOnce()
    expect(host.firstElementChild).not.toBeNull()
    unmount()

    const second = inactive({ value: 4 })
    expect(core).toHaveBeenCalledTimes(2)
    expect(second.controller.value).toBe(4)
    expect(second.plugin).not.toBe(first.plugin)
    dispose()
  })
})

test('addProps 提交的 domRef 在节点接入前不调用', () => {
  createRoot((dispose) => {
    const received: HTMLElement[] = []
    const callback = (el: HTMLElement) => {
      received.push(el)
    }
    const inactive = defineInactivePlugin({
      name: 'dom',
      pluginCore({ addProps }) {
        addProps({ domRef: callback })
        addProps({ class: 'sample' })
        return { ready: true }
      },
    })
    const { plugin, controller } = inactive()
    expect(controller.ready).toBe(true)

    expect(received).toEqual([])
    const host = document.createElement('div')
    const unmount = render(() => createComponent(Piv, { is: plugin }), host)
    const element = host.firstElementChild as HTMLElement
    expect(element.classList.contains('sample')).toBe(true)
    expect(received).toEqual([element])
    unmount()
    dispose()
  })
})

test('PluginInput 识别 Plugin 与能力结果；普通回调和无效对象被拒绝', () => {
  const capability = defineInactivePlugin({
    name: 'plain',
    pluginCore() {
      return {}
    },
  })()

  expect(isPlugin(capability.plugin)).toBe(true)
  expect(isPlugin(capability)).toBe(false)
  expect(readPlugin(capability)).toBe(capability.plugin)
  expect(readPlugin(capability.plugin)).toBe(capability.plugin)

  const plainCallback = () => undefined
  expect(() => readPlugin(plainCallback as never)).toThrow(TypeError)
  expect(() =>
    readPlugin(
      Object.assign(plainCallback, { [pluginMarker]: 'old' }) as never,
    ),
  ).toThrow(TypeError)
  expect(() => readPlugin({ plugin: plainCallback } as never)).toThrow(
    TypeError,
  )
  expect(() => readPlugin({} as never)).toThrow(TypeError)
})
