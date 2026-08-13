/** 显式实例化 Plugin，并把这一实例的 controller 暴露给调用方。 */
import type { PivTag } from '../Piv/domMap'
import type { PivPluginFunction } from '../Piv/plugin/runPlugin'
import { consumePlugin } from './consumePlugin'
import type { Plugin } from './definePlugin'

export function usePlugin<Options, Controller extends object, Tag extends PivTag>(
  plugin: Plugin<Options, Controller, Tag>,
  options?: Options,
): [plugin: PivPluginFunction<Tag>, controller: Controller] {
  const instance = arguments.length > 1
    ? consumePlugin(plugin, options)
    : consumePlugin(plugin)
  return [instance.plugin, instance.controller]
}
