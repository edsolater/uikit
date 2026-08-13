/**
 * Plugin Consumer。
 * 本文件独占 Plugin 的识别与实例化知识，并为每次消费创建独立实例。
 */
import type { PivTag } from '../Piv/domMap'
import {
  createPluginInstanceSymbol,
  type Plugin,
  type PluginInstance,
} from './definePlugin'

export function consumePlugin<Options, Controller extends object, Tag extends PivTag>(
  plugin: Plugin<Options, Controller, Tag>,
  options?: Options,
): PluginInstance<Controller, Tag>
export function consumePlugin<Tag extends PivTag>(
  plugin: unknown,
): PluginInstance<object, Tag> | undefined
export function consumePlugin<Options, Controller extends object, Tag extends PivTag>(
  plugin: unknown,
  options?: Options,
): PluginInstance<Controller, Tag> | undefined {
  if (!isPlugin<Options, Controller, Tag>(plugin)) return undefined
  const targetPlugin = arguments.length > 1 ? plugin(options) : plugin
  return targetPlugin[createPluginInstanceSymbol]()
}

function isPlugin<Options, Controller extends object, Tag extends PivTag>(
  value: unknown,
): value is Plugin<Options, Controller, Tag> {
  return typeof value === 'function' && createPluginInstanceSymbol in value
}
