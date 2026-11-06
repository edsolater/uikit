/**
 * inactivePlugin 的多元构造。
 *
 * 按名称组织一组业务 core；返回可调用组合。每次组合调用创建一份内部共享身份，
 * 逐项委托单元构造，得到各自完整的 PluginResult。
 *
 * 组合定义可放模块顶层；组合调用会构建全部角色，因此必须在组件内完成。
 */
import {
  defineInactivePlugin,
  type PluginCoreContext,
  type PluginResult,
} from './defineInactivePlugin'
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

/** 每个角色对应的配置；必填字段保持必填。 */
export type PluginsOptions<Definitions extends Record<string, AnyPluginCore>> = {
  [Name in keyof Definitions as {} extends OptionsOf<Definitions[Name]>
    ? never
    : Name]: OptionsOf<Definitions[Name]>
} & {
  [Name in keyof Definitions as {} extends OptionsOf<Definitions[Name]>
    ? Name
    : never]?: OptionsOf<Definitions[Name]>
}

/** 全部角色都可缺省时组合调用允许无参数。 */
type PluginsCallParameters<Definitions extends Record<string, AnyPluginCore>> =
  {} extends PluginsOptions<Definitions>
    ? [pluginOptions?: PluginsOptions<Definitions>]
    : [pluginOptions: PluginsOptions<Definitions>]

/** 组合调用功能；返回每个角色的完整结果。 */
export type InactivePlugins<
  Definitions extends Record<string, AnyPluginCore>,
> = (
  ...options: PluginsCallParameters<Definitions>
) => {
  [Name in keyof Definitions]: PluginResult<MembersOf<Definitions[Name]>>
}

/**
 * 逐项按对象键定义能力，返回可调用组合。
 *
 * 每次组合调用生成一份内部对象身份，本组各角色共享；该身份不返回给调用者，
 * 也不加入公开 Options。角色按单元构建流程各自准备状态与 Controller。
 */
export function defineInactivePlugins<
  const Definitions extends Record<string, AnyPluginCore>,
>(
  buildTimeDefinitions: Definitions & {
    [Name in keyof Definitions]: Parameters<
      Definitions[Name]
    >[0]['pluginOptions'] extends object
      ? unknown
      : never
  },
): InactivePlugins<Definitions> {
  const definitions = buildTimeDefinitions as Definitions
  return ((
    pluginOptions: Record<string, object | undefined> = {},
  ) => {
    // 只属于这一次组合调用，不返回给调用者。
    const id = {}
    return map(definitions, (pluginCore, name) => {
      const inactivePlugin = defineInactivePlugin({
        name,
        pluginCore: (context: PluginCoreContext<object>) =>
          pluginCore({ ...context, id }),
      })
      return inactivePlugin(pluginOptions[name])
    })
  }) as unknown as InactivePlugins<Definitions>
}
