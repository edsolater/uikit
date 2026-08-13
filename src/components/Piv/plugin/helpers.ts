import type { PivTag } from '../domMap'
import type { PivPlugin, PivPluginFunction } from './runPlugin'
import type { AnyRecord } from '@edsolater/fnkit'

/**
 * 创建 Piv plugin。
 *
 * (虽然是任意还是都可以，但是通过此函数创建的话，它就有创建时的类型了)
 * 这个函数本身不包运行逻辑，只用于让插件作者在定义处获得稳定的类型边界。
 */
export function createPivPlugin<Tag extends PivTag>(fn: PivPluginFunction<Tag>): PivPluginFunction<Tag> {
  return fn
}

/**
 * 创建 Piv plugin hook 工厂。
 * 这个函数固定“配置生成 hook，hook 返回状态和 plugin”的形状，不参与状态创建或 plugin 运行。
 *
 * @example
 * // ---------- 定义在普通代码中 ----------
 * const createMiniMapPlugin = createPluginHookCreator<{ initZoom: number }, { zoom: number }>((options) => {
 *   const [zoom, setZoom] = createSignal(options.initZoom)
 *   const plugin = createPivPlugin(() => {
 *     return {
 *       style: { transform: `scale(${zoom()})` },
 *     }
 *   })
 *   return [ { zoom }, plugin ]
 * })
 *
 *
 * // ----------  hooks 在组件中使用  ----------
 * function FooComponent() {
 *   const [miniMapState, miniMapPlugin] = createMiniMapPlugin({ initZoom: 0.5 })
 *   return <Piv plugins={miniMapPlugin}>...</Piv>
 * }
 */
export function createPluginHookCreator<HookOptions extends AnyRecord, State extends AnyRecord>(
  runInComponent: (hookOptions: HookOptions) => [plugin: PivPlugin<PivTag>, state: State],
): (hookOptions: HookOptions) => [plugin: PivPlugin<PivTag>, state: State] {
  return runInComponent
}
