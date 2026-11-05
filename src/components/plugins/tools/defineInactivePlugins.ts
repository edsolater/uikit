/** inactivePlugin 的多元构造。
 *
 * 按名称将一组节点算法分别交给单元构造。
 *
 * 一组能力共用定义形式，不共享节点资源或隐含配对。
 */
import {
  defineInactivePlugin,
  type InactivePlugin,
  type PluginContext,
} from './defineInactivePlugin'
import { map } from '@edsolater/fnkit'

type AnyCore = (context: PluginContext & { pluginOptions: any }) => object
export type InactivePlugins<Definitions extends Record<string, AnyCore>> = {
  [Name in keyof Definitions]: InactivePlugin<
    Parameters<Definitions[Name]>[0]['pluginOptions'],
    ReturnType<Definitions[Name]>
  >
}

/**
 * 逐项按对象键定义能力；只组织工厂，不创建节点或连接。
 */
export function defineInactivePlugins<
  const Definitions extends Record<string, AnyCore>,
>(
  buildTimeDefinitions: Definitions & {
    [Name in keyof Definitions]: Parameters<
      Definitions[Name]
    >[0]['pluginOptions'] extends object
      ? unknown
      : never
  },
): InactivePlugins<Definitions> {
  return map(buildTimeDefinitions, (pluginCore, name) =>
    defineInactivePlugin({ name, pluginCore }),
  ) as InactivePlugins<Definitions>
}
