/** inactivePlugin 的单元构造。
 *
 * 以名称和节点算法创建可配置工厂，安装后返回节点功能成员。
 *
 * 构造和配置不启动节点资源。
 */
import type { ShadowProps } from '@/components/Piv/plugin/handlePivPlugin'
import type { PivTag } from '@/components/Piv/domMap'

/** 节点作用域负责清理。 */
export type PluginCleanup = (cleanup: () => void) => void

/**
 * 为当前节点提交补充 Props，例如 class、style、htmlProps 和 on。
 *
 * Piv 负责合并声明、绑定事件和响应更新；调用者直接提供的 Props 优先。
 * 不能通过此入口改变 as、if 或 children；附属内容使用 Piv 的结构插入工具。
 *
 * @example
 * addProps({ class: 'is:tabular-num' })
 */
export type PluginAddProps = (props: ShadowProps<PivTag>) => void

/** 实际节点及其能力接线。 */
export interface PluginContext {
  /** 当前安装 Plugin 的真实节点。 */
  element: HTMLElement
  /** 将资源清理登记到当前节点生命周期。 */
  onCleanup: PluginCleanup
  /**
   * 提交补充 Props，参与 Piv 原有合并；调用者直接 Props 优先。
   * 不能通过此入口改变 as、if 或 children。
   */
  addProps: PluginAddProps
}

/** 已配置并等待节点执行的能力。 */
export type Plugin<Members extends object = object> = {
  /**
   * 在实际节点安装能力，并返回该节点的功能成员。
   */
  (context: PluginContext): Members
  readonly [pluginMarker]: string
}

/** 节点能力配置工厂。 */
export type InactivePlugin<
  Options extends object = object,
  Members extends object = object,
> = {} extends Options
  ? (pluginOptions?: Options) => Plugin<Members>
  : (pluginOptions: Options) => Plugin<Members>

/** 识别当前节点执行协议，不参与节点状态存储。 */
export const pluginMarker = Symbol('nodePlugin')

/**
 * 用稳定名称和节点算法定义能力；配置调用只产生等待安装的 Plugin。
 */
export function defineInactivePlugin<
  Options extends object,
  Members extends object,
>(buildTimeDefinitions: {
  name: string
  /**
   * 创建当前节点的状态与行为，并返回功能成员。
   */
  pluginCore: (context: PluginContext & { pluginOptions: Options }) => Members
}): InactivePlugin<Options, Members> {
  const { name, pluginCore } = buildTimeDefinitions
  return ((pluginOptions: Options = {} as Options) => {
    const plugin: Plugin<Members> = Object.assign(
      ({ element, onCleanup, addProps }: PluginContext) => {
        const cleanups: (() => void)[] = []
        const cleanup = () => {
          for (const release of cleanups.reverse()) release()
        }
        try {
          const members = pluginCore({
            pluginOptions,
            element,
            onCleanup: (cleanup) => cleanups.push(cleanup),
            addProps,
          })
          onCleanup(cleanup)
          return members
        } catch (error) {
          cleanup()
          throw error
        }
      },
      { [pluginMarker]: name },
    )
    return plugin
  }) as InactivePlugin<Options, Members>
}
