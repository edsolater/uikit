/**
 * Plugin 定义协议。
 * 本文件只负责描述和创建可配置的 Plugin，不负责消费或运行 Plugin。
 */
import type { PivTag } from '../Piv/domMap'
import type { PivPluginFunction } from '../Piv/plugin/runPlugin'

/** 仅供 Plugin Consumer 识别并实例化 Plugin，不从领域入口公开。 */
export const createPluginInstanceSymbol = Symbol('createPluginInstance')

export interface PluginInstance<Controller extends object, Tag extends PivTag> {
  plugin: PivPluginFunction<Tag>
  controller: Controller
}

/**
 * Plugin 本身可以直接交给 Consumer，也可以先传入 options 得到一份配置后的 Plugin。
 */
export interface Plugin<Options = undefined, Controller extends object = object, Tag extends PivTag = PivTag> {
  (options?: Options): Plugin<Options, Controller, Tag>
  [createPluginInstanceSymbol](): PluginInstance<Controller, Tag>
}

/**
 * 定义一个 Plugin。createInstance 只有在 Plugin 被 Consumer 消费时才会执行。
 */
export function createPlugin<Options = undefined, Controller extends object = object, Tag extends PivTag = PivTag>(
  createInstance: (options: Options | undefined) => PluginInstance<Controller, Tag>,
): Plugin<Options, Controller, Tag> {
  return createConfiguredPlugin(createInstance, undefined)
}

function createConfiguredPlugin<Options, Controller extends object, Tag extends PivTag>(
  createInstance: (options: Options | undefined) => PluginInstance<Controller, Tag>,
  configuredOptions: Options | undefined,
): Plugin<Options, Controller, Tag> {
  const plugin = ((options?: Options) => createConfiguredPlugin(createInstance, options)) as Plugin<
    Options,
    Controller,
    Tag
  >

  Object.defineProperty(plugin, createPluginInstanceSymbol, {
    value: () => createInstance(configuredOptions),
  })

  return plugin
}
