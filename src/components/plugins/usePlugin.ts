/** 显式实例化 Plugin，并把这一实例的 controller 暴露给调用方。 */
import type { PivTag } from '../Piv/domMap'
import type { PivPluginFunction } from '../Piv/plugin/runPlugin'
import { createPluginInstanceSymbol, type Plugin } from './definePlugin'

export function usePlugin<Options, Controller extends object, Tag extends PivTag>(
  plugin: Plugin<Options, Controller, Tag>,
  options?: Options,
): [plugin: PivPluginFunction<Tag>, controller: Controller] {
  const targetPlugin = arguments.length > 1 ? plugin(options) : plugin
  const instance = targetPlugin[createPluginInstanceSymbol]()
  return [instance.plugin, instance.controller]
}
