/** 为一个节点配置 Plugin，并取得该节点的功能控制入口。 */
import { createRef } from '@/hooks/createRef'
import { runWithOwner } from '@/foundation/reactivity'
import {
  pluginMarker,
  type Plugin,
  type PluginContext,
} from './defineInactivePlugin'

/** 同一个受控 Plugin 同时只安装到一个节点，卸载后可重新安装。 */
export function usePlugin<
  PluginOptions extends [pluginOptions?: object],
  Controller extends object,
>(
  inactivePlugin: (...pluginOptions: PluginOptions) => Plugin<Controller>,
  ...pluginOptions: PluginOptions
): [plugin: Plugin<Controller>, controller: Partial<Controller>] {
  const plugin = inactivePlugin(...pluginOptions)
  // 控制入口可在组件退出后被持有；节点清理负责释放绑定。
  const [controller, receive] = runWithOwner(null, () =>
    createRef<Controller>(),
  )
  let mounted = false
  const controlled = Object.assign(
    (context: PluginContext) => {
      if (mounted)
        throw new Error(`受控 Plugin ${plugin[pluginMarker]} 已安装到其他节点`)
      mounted = true
      try {
        const members = plugin(context)
        const release = receive(members)
        context.onCleanup(() => {
          release?.()
          mounted = false
        })
        return members
      } catch (error) {
        mounted = false
        throw error
      }
    },
    { [pluginMarker]: plugin[pluginMarker] },
  )
  return [controlled, controller]
}
