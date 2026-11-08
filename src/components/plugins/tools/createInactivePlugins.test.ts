/** 组合能力的构建、内部共享身份与角色配置类型。 */
import { createRoot } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createInactivePlugins } from './createInactivePlugins'
import type { PluginCoreContext } from './createInactivePlugin'

test('组合返回可调用函数；同次调用共享内部身份，不同调用互相隔离', () => {
  createRoot((dispose) => {
    const group = createInactivePlugins({
      first: ({ pluginOptions, id }: PluginCoreContext<{ payload: string }>) => ({
        id,
        payload: pluginOptions.payload,
      }),
      second: ({ id }: PluginCoreContext<{ disabled?: boolean }>) => ({ id }),
    })

    const firstCall = group({ first: { payload: '材料' }, second: {} })
    expect(firstCall.controller.first.payload).toBe('材料')
    expect(firstCall.controller.first).toBe(firstCall.plugins.first.controller)
    expect(firstCall.controller.second).toBe(firstCall.plugins.second.controller)
    expect(firstCall.controller.first.id).toBe(firstCall.controller.second.id)
    expect(firstCall.plugins.first.plugin).not.toBe(firstCall.plugins.second.plugin)

    const secondCall = group({ first: { payload: '材料' }, second: {} })
    expect(secondCall.controller.first.id).not.toBe(
      firstCall.controller.first.id,
    )
    dispose()
  })
})

test('全部角色可缺省时允许无参数调用；必填角色配置仍必填', () => {
  createRoot((dispose) => {
    const optional = createInactivePlugins({
      first: ({}: PluginCoreContext<Record<string, never>>) => ({}),
      second: ({}: PluginCoreContext<{ flag?: boolean }>) => ({}),
    })
    expect(() => optional()).not.toThrow()
    expect(() => optional({ second: { flag: true } })).not.toThrow()

    const required = createInactivePlugins({
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
      required({ draggable: { payload: '材料' } }).plugins.draggable()
      // @ts-expect-error Controller 方法拼错。
      required({ draggable: { payload: '材料' } }).controller.draggable.unrelated()
      createInactivePlugins({
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

test('组合快捷入口取得完整角色类型并保留原方法引用', () => {
  createRoot((dispose) => {
    let calls = 0
    const group = createInactivePlugins({
      first: ({ pluginOptions }: PluginCoreContext<{ value: number }>) => ({
        run: () => pluginOptions.value,
      }),
      second: ({}: PluginCoreContext<{}>) => ({ active: true }),
    }, {
      controller(controllers) {
        calls++
        expectTypeOf(controllers.second.active).toEqualTypeOf<boolean>()
        if (false) {
          // @ts-expect-error 回调中的角色保持准确类型。
          controllers.first.unrelated()
        }
        return { run: controllers.first.run }
      },
    })
    const result = group({ first: { value: 7 } })
    expect(calls).toBe(1)
    expect(result.controller.run).toBe(result.controller.first.run)
    expect(result.controller.first).toBe(result.plugins.first.controller)
    expect(result.controller.run()).toBe(7)
    expectTypeOf(result.controller.run).returns.toEqualTypeOf<number>()
    if (false) {
      // @ts-expect-error 扩展 Controller 不改变角色配置的必填要求。
      group({})
    }
    dispose()
  })
})
