/** 组合能力的构建、内部共享身份与角色配置类型。 */
import { createRoot } from 'solid-js'
import { expect, test } from 'vitest'
import { defineInactivePlugins } from './defineInactivePlugins'
import type { PluginCoreContext } from './defineInactivePlugin'

test('组合返回可调用函数；同次调用共享内部身份，不同调用互相隔离', () => {
  createRoot((dispose) => {
    const group = defineInactivePlugins({
      first: ({ pluginOptions, id }: PluginCoreContext<{ payload: string }>) => ({
        id,
        payload: pluginOptions.payload,
      }),
      second: ({ id }: PluginCoreContext<{ disabled?: boolean }>) => ({ id }),
    })

    const firstCall = group({ first: { payload: '材料' }, second: {} })
    expect(firstCall.first.controller.payload).toBe('材料')
    expect(firstCall.first.controller.id).toBe(firstCall.second.controller.id)
    expect(firstCall.first.plugin).not.toBe(firstCall.second.plugin)

    const secondCall = group({ first: { payload: '材料' }, second: {} })
    expect(secondCall.first.controller.id).not.toBe(
      firstCall.first.controller.id,
    )
    dispose()
  })
})

test('全部角色可缺省时允许无参数调用；必填角色配置仍必填', () => {
  createRoot((dispose) => {
    const optional = defineInactivePlugins({
      first: ({}: PluginCoreContext<Record<string, never>>) => ({}),
      second: ({}: PluginCoreContext<{ flag?: boolean }>) => ({}),
    })
    expect(() => optional()).not.toThrow()
    expect(() => optional({ second: { flag: true } })).not.toThrow()

    const required = defineInactivePlugins({
      draggable: ({ pluginOptions }: PluginCoreContext<{ payload: string }>) =>
        pluginOptions,
      droppable: ({}: PluginCoreContext<{ onDrop?: () => void }>) => ({}),
    })
    expect(() => required({ draggable: { payload: '材料' } })).not.toThrow()

    if (false) {
      // @ts-expect-error draggable 的 payload 必填。
      required({})
      // @ts-expect-error 角色名拼错。
      required({ draggable: { payload: '材料' }, droppableItem: {} })
      // @ts-expect-error 公开组合配置不再接受共享 id。
      required({ draggable: { payload: '材料', id: {} } })
      // @ts-expect-error 每个角色已是结果，不能再次调用。
      required({ draggable: { payload: '材料' } }).draggable()
      // @ts-expect-error Controller 方法拼错。
      required({ draggable: { payload: '材料' } }).draggable.controller.unrelated()
      defineInactivePlugins({
        // @ts-expect-error pluginOptions 必须是对象，不能声明为 string。
        bad: ({
          pluginOptions,
        }: PluginCoreContext<object> & { pluginOptions: string }) =>
          pluginOptions,
      })
    }
    dispose()
  })
})
