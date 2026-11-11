/**
 * inactivePlugin 的单元构造。
 *
 * 以名称和业务 core 创建可配置工厂；每次配置调用只运行一次 core，收集声明并
 * 返回完整 Controller 与保存声明的 Plugin。
 *
 * 定义可以放模块顶层；配置调用会立即执行 core 并创建状态，因此必须在组件内完成，
 * 组件内的 JSX 内联调用合法。
 */
import {
  hasProperty,
  isObject,
  isString,
  toPromiseResultProxy,
  type PromiseResultProxy,
} from '@edsolater/fnkit'
import type { ShadowProps } from '@/components/Piv/plugin/mergePivProps'
import type { PivTag } from '@/components/Piv/domMap'

/** 识别 Plugin 声明，不参与节点状态存储。 */
export const pluginMarker = Symbol('nodePlugin')

/**
 * 提交一份补充声明。
 *
 * 声明在节点创建前参与结构字段（as、if）解析，在节点创建后进入字段合并与绑定；
 * 调用者直接提供的 Props 优先。children 仍由直接 Props 提供。
 */
export type PluginAddProps = (props: ShadowProps<PivTag>) => void

/** 带标识的补充声明；不接收元素，也不执行节点接入。 */
export type Plugin = ShadowProps<PivTag> & {
  readonly [pluginMarker]: string
}

/** core 在配置时使用的上下文。 */
export type PluginCoreContext<Options extends object> = {
  /** 本次能力构建的配置；声明消费时保留其动态读取契约。 */
  pluginOptions: Options

  /** 收集统一 ShadowProps；包含 as、if、domRef 和 is。 */
  addProps: PluginAddProps

  /** 同步构建时读取以准备首次节点获取；重复读取返回同一代理。 */
  readonly domProxy: PromiseResultProxy<HTMLElement>

  /** 组合构建内部共享身份，不是公开配置。 */
  id?: object
}

/** 配置时准备状态与完整 Controller，并提交声明。 */
export type PluginCore<Options extends object, Members extends object> = (
  context: PluginCoreContext<Options>,
) => Members

/** is 只关心 plugin；能力结果中的附加字段不参加节点属性合并。 */
export type PluginInput =
  | Plugin
  | {
      readonly plugin: Plugin
      [extra: string]: unknown
    }

/** 单元能力每次构建的完整结果。 */
export type PluginResult<Members extends object> = {
  readonly plugin: Plugin
  readonly controller: Members
}

/** 节点能力配置工厂；配置调用就是一次构建。 */
export type InactivePlugin<
  Options extends object = object,
  Members extends object = object,
> = {} extends Options
  ? (pluginOptions?: Options) => PluginResult<Members>
  : (pluginOptions: Options) => PluginResult<Members>

/** 根据既有 pluginMarker 识别 Plugin 对象。 */
export function isPlugin(input: unknown): input is Plugin {
  return (
    isObject(input) &&
    hasProperty(input, pluginMarker, (marker): marker is string =>
      isString(marker),
    )
  )
}

/** 从 Plugin 或携带有效 plugin 的对象取出 Plugin；普通回调和无效对象被拒绝。 */
export function readPlugin(input: PluginInput): Plugin {
  if (isPlugin(input)) return input
  if (hasProperty(input, 'plugin') && isPlugin(input.plugin))
    return input.plugin
  throw new TypeError('需要 Plugin，或包含有效 plugin 的对象')
}

/**
 * 用稳定名称和业务 core 定义能力。
 *
 * 定义阶段不运行 core；每次调用 inactivePlugin 构建一次结果，运行一次 core，
 * 返回完整 Controller 和保存本次声明的 Plugin。
 */
export function createInactivePlugin<
  Options extends object,
  Members extends object,
>(buildTimeDefinitions: {
  name: string
  pluginCore: PluginCore<Options, Members>
}): InactivePlugin<Options, Members> {
  const { name, pluginCore } = buildTimeDefinitions
  return ((pluginOptions: Options = {} as Options) => {
    const shadowProps: ShadowProps<PivTag>[] = []
    const plugin: Plugin = { [pluginMarker]: name, shadowProps }
    const addProps: PluginAddProps = (props) => shadowProps.push(props)
    let cachedDomProxy: PromiseResultProxy<HTMLElement> | undefined
    const controller = pluginCore({
      pluginOptions,
      addProps,
      get domProxy() {
        if (!cachedDomProxy) {
          const first = Promise.withResolvers<HTMLElement>()
          // 固定首次 DOM；if 显隐复用该元素，不追踪宿主替换。
          addProps({ domRef: (el) => first.resolve(el) })
          cachedDomProxy = toPromiseResultProxy(first.promise)
        }
        return cachedDomProxy
      },
    })

    return { plugin, controller }
  }) as InactivePlugin<Options, Members>
}
