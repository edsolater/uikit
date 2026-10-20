/**
 * 这个文件定义 Piv plugin 的展开和合并规则。
 * plugin 可以返回低优先级 shadow props；用户直接传入的 props 始终覆盖 plugin 结果。
 * 它只产出声明数据，不消费 class、style、HTML props、事件或 ref。
 */
import { mayMap, mergeMayArray, toArray, type ID, type MayArray } from '@edsolater/fnkit'
import { val, type StateView } from '@/foundation'
import { derive } from '@/hooks/stateUtils'
import type { PivProps } from '../Piv'
import type { PivHTMLElement, PivTag } from '../domMap'
import { runPlugin, type PivPlugin } from './runPlugin'
import { getPublicPluginSources } from './publicCapabilities'
import { mapArray } from '@/foundation/render'

/** plugin 系统允许补充的 props；不包含决定 DOM 结构的 as、if、children。 */
export type ShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'as' | 'if' | 'children'>

/** id 是持续合并声明的稳定派生来源，其余字段保持原有输入契约。 */
type MergedPivProps<Tag extends PivTag> = Omit<ShadowProps<Tag>, 'id'> & { id?: StateView<MayArray<ID> | undefined> }

/**
 * 把直接 props、shadowProps、trait 和 plugin 返回值整合成 Piv 最终消费的 props。
 * id 输出稳定的合并 Source；class、style、htmlProps 保留用于声明解析和字段作用域的惰性读取。
 */
export function mergePivProps<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  rawProps: ShadowProps<Tag>,
): MergedPivProps<Tag> {
  const rawPropsList = [rawProps, ...expandPlugins(getPluginFromShadowProps(rawProps), element)]
  const pluginSources = getPublicPluginSources(rawPropsList)
  const injected = pluginSources.length
    ? mapArray(
      () => pluginSources.map(source => val(source))
        .filter((plugin): plugin is PivPlugin<Tag> => plugin !== undefined),
      plugin => expandPlugins([plugin], element),
    )
    : () => []
  return createMergedProps(() => [...rawPropsList, ...injected().flat()])
}

/** 插件展开共用同一执行栈，保持原顺序与返回协议。 */
function expandPlugins<Tag extends PivTag>(plugins: PivPlugin<Tag>[], element: PivHTMLElement<Tag>) {
  const declarations: ShadowProps<Tag>[] = []
  const pluginsQueue = [...plugins]

  while (pluginsQueue.length > 0) {
    const plugin = pluginsQueue.pop()
    if (!plugin) continue
    const result = runPlugin(plugin, element)
    if (result) {
      const newDeepQueueFromResult = getPluginFromShadowProps(result)
      pluginsQueue.push(...newDeepQueueFromResult)
      declarations.push(result)
    }
  }

  return declarations
}

/** 把一份 raw props 携带的 trait、shadowProps、plugin 和 plugins 归一成待执行 plugin 队列。 */
function getPluginFromShadowProps<Tag extends PivTag>(props: ShadowProps<Tag>): PivPlugin<Tag>[] {
  return toArray(
    props.trait,
    mayMap(props.shadowProps, (shadow) => () => shadow),
    props.plugin,
    props.plugins,
  )
}

/**
 * 为整合后的 props 建立 id 来源与其他字段的 getter。
 * 读取最新完整声明，字段合并仍沿低优先级到高优先级的原顺序。
 */
function createMergedProps<Tag extends PivTag>(readDeclarations: () => ShadowProps<Tag>[]): MergedPivProps<Tag> {
  const id = derive([readDeclarations], ([read]) => mergePivPropValue(read(), 'id'))
  const readProperty = (key: keyof ShadowProps<Tag>) => key === 'id'
    ? id
    : mergePivPropValue(readDeclarations(), key)
  const hasProperty = (key: PropertyKey) => readDeclarations().some(props => key in props)
  return new Proxy({}, {
    get: (_, key) => readProperty(key as keyof ShadowProps<Tag>),
    has: (_, key) => hasProperty(key),
    ownKeys: () => [...new Set(readDeclarations().flatMap(props => Object.keys(props)))],
    getOwnPropertyDescriptor: (_, key) => hasProperty(key)
      ? { enumerable: true, configurable: true, get: () => readProperty(key as keyof ShadowProps<Tag>) }
      : undefined,
  }) as MergedPivProps<Tag>
}

/** 读取并合并一个字段；val 只解包 StateView，事件回调等普通函数会保持原值。 */
function mergePivPropValue<Tag extends PivTag>(rawPropsList: ShadowProps<Tag>[], key: 'id'): MayArray<ID> | undefined
function mergePivPropValue<Tag extends PivTag, Key extends keyof ShadowProps<Tag>>(
  rawPropsList: ShadowProps<Tag>[],
  key: Key,
): ShadowProps<Tag>[Key]
function mergePivPropValue<Tag extends PivTag>(
  rawPropsList: ShadowProps<Tag>[],
  key: keyof ShadowProps<Tag>,
): unknown {
  let mergedValue: unknown = undefined

  for (const rawProps of rawPropsList.toReversed()) {
    const rawValue = rawProps[key]
    if (rawValue === undefined) continue
    const value: unknown = val(rawValue)
    mergedValue = mergedValue === undefined
      ? value
      : mergeMayArray(mergedValue, value)
  }

  return mergedValue
}
