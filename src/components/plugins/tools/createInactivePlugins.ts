/**
 * inactivePlugin 的多元构造。
 *
 * 按名称组织一组业务 core；返回可调用组合。每次组合调用创建一份内部共享身份，
 * 逐项委托单元构造，统一返回角色能力结果与对应 Controller 的集合。
 *
 * 组合定义可放模块顶层；组合调用会构建全部角色，因此必须在组件内完成。
 */
import {
  createInactivePlugin,
  type PluginCoreContext,
  type PluginResult,
} from './createInactivePlugin'
import { map } from '@edsolater/fnkit'

type AnyPluginCore = (context: PluginCoreContext<any>) => object

type OptionsOf<Core> = Core extends (
  context: PluginCoreContext<infer Options>,
) => unknown
  ? Options
  : never

type MembersOf<Core> = Core extends (...args: any[]) => infer Members
  ? Members
  : never

/** 按角色汇集各自完整的 Controller。 */
type ControllersOf<Definitions extends Record<string, AnyPluginCore>> = {
  [Name in keyof Definitions]: MembersOf<Definitions[Name]>
}

/** 每个角色对应的配置；必填字段保持必填。 */
export type PluginsOptions<Definitions extends Record<string, AnyPluginCore>> =
  {
    [
      Name in keyof Definitions as {} extends OptionsOf<Definitions[Name]>
        ? never
        : Name
    ]: OptionsOf<Definitions[Name]>
  } & {
    [
      Name in keyof Definitions as {} extends OptionsOf<Definitions[Name]>
        ? Name
        : never
    ]?: OptionsOf<Definitions[Name]>
  }

/** 全部角色都可缺省时组合调用允许无参数。 */
type PluginsCallParameters<Definitions extends Record<string, AnyPluginCore>> =
  {} extends PluginsOptions<Definitions>
    ? [pluginOptions?: PluginsOptions<Definitions>]
    : [pluginOptions: PluginsOptions<Definitions>]

/** 组合调用功能；plugins 保留完整角色结果，controller 引用各端原 Controller。 */
export type InactivePlugins<
  Definitions extends Record<string, AnyPluginCore>,
  Extra extends object = {},
> = (...options: PluginsCallParameters<Definitions>) => {
  plugins: {
    [Name in keyof Definitions]: PluginResult<MembersOf<Definitions[Name]>>
  }
  controller: ControllersOf<Definitions> & Extra
}

/**
 * 逐项按对象键定义能力，返回可调用组合。
 *
 * 每次组合调用生成一份内部对象身份，本组各角色共享；该身份不返回给调用者，
 * 也不加入公开 Options。角色按单元构建流程各自准备状态与 Controller。
 * 组合调用返回 { plugins, controller }；plugins.role 可交给 is，controller.role 引用该端原 Controller。
 * 第二参数的 controller 回调可在角色汇集后追加组合快捷入口，不改变角色构建。
 * @example
 * const transfer = createInactivePlugins({ draggable: draggablePluginCore, droppable: droppablePluginCore })
 * const { plugins, controller } = transfer({ draggable: { payload: item } })
 * controller.draggable.disable()
 */
export function createInactivePlugins<
  const Definitions extends Record<string, AnyPluginCore>,
  Extra extends object = {},
>(
  buildTimeDefinitions: Definitions & {
    [Name in keyof Definitions]: Parameters<
      Definitions[Name]
    >[0]['pluginOptions'] extends object
      ? unknown
      : never
  },
  options?: {
    /**
     * 全部角色构建完成后，提供引用现有状态和方法的组合快捷入口。
     */
    controller?: (controllers: ControllersOf<Definitions>) => Extra
  },
): InactivePlugins<Definitions, Extra> {
  const definitions = buildTimeDefinitions as Definitions
  return ((pluginOptions: Record<string, object | undefined> = {}) => {
    // 只属于这一次组合调用，不返回给调用者。
    const id = {}
    const plugins = map(definitions, (roleCore, name) => {
      const inactivePlugin = createInactivePlugin({
        name,
        pluginCore(context: PluginCoreContext<object>) {
          context.id = id
          return roleCore(context)
        },
      })
      return inactivePlugin(pluginOptions[name])
    })
    const controller = map(
      plugins,
      (role) => role.controller,
    ) as ControllersOf<Definitions>
    return {
      plugins,
      controller: { ...controller, ...options?.controller?.(controller) },
    }
  }) as unknown as InactivePlugins<Definitions, Extra>
}
