/**
 * 这个文件定义 Piv plugin 的展开和合并规则。
 * plugin 可以返回低优先级 shadow props；用户直接传入的 props 始终覆盖 plugin 结果。
 * 它只产出声明数据，不消费 class、style、HTML props、事件或 ref。
 */
import { mergeMayArray, toArray, mayMap } from '@edsolater/fnkit'
import { val } from '../../../hooks'
import type { PivProps } from '../Piv'
import type { PivHTMLElement, PivTag } from '../domMap'
import { runPlugin, type PivPlugin } from './runPlugin'

/** plugin 系统允许补充的 props；不包含决定 DOM 结构的 as、if、children。 */
export type ShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'as' | 'if' | 'children'>

/**
 * 把直接 props、shadowProps、trait 和 plugin 返回值整合成 Piv 最终消费的 props。
 * 每个字段使用惰性 getter，只有 class、style、htmlProps 等终端真正读取时才合并并建立响应式依赖。
 */
export function mergePivProps<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  rawProps: ShadowProps<Tag>,
): ShadowProps<Tag> {
  const rawPropsList: ShadowProps<Tag>[] = [rawProps]
  let pluginsQueue: PivPlugin<Tag>[] = getPluginFromShadowProps(rawProps)

  while (pluginsQueue.length > 0) {
    const plugin = pluginsQueue.pop()
    if (!plugin) continue
    const result = runPlugin(plugin, element)
    if (result) {
      const newDeepQueueFromResult = getPluginFromShadowProps(result)
      pluginsQueue.push(...newDeepQueueFromResult)
      rawPropsList.push(result)
    }
  }

  return createMergedProps(rawPropsList)
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
 * 为整合后的 props 创建字段 getter。
 * rawPropsList 内部顺序服务 plugin 执行，读取时反转为低优先级到高优先级。
 */
function createMergedProps<Tag extends PivTag>(rawPropsList: ShadowProps<Tag>[]): ShadowProps<Tag> {
  const props = {} as ShadowProps<Tag>
  const propKeys = new Set(rawPropsList.flatMap((rawProps) => Object.keys(rawProps)))

  for (const key of propKeys as Set<keyof ShadowProps<Tag>>) {
    Object.defineProperty(props, key, {
      enumerable: true,
      get: () => mergePivPropValue(rawPropsList, key),
    })
  }

  return props
}

/** 读取并合并一个字段；val 只解包 StateView，事件回调等普通函数会保持原值。 */
function mergePivPropValue<Tag extends PivTag, Key extends keyof ShadowProps<Tag>>(
  rawPropsList: ShadowProps<Tag>[],
  key: Key,
): ShadowProps<Tag>[Key] {
  let mergedValue: unknown = undefined

  for (const rawProps of rawPropsList.toReversed()) {
    const rawValue = rawProps[key]
    if (rawValue === undefined) continue
    const value: unknown = val(rawValue)
    mergedValue = mergedValue === undefined
      ? value
      : mergeMayArray(mergedValue, value)
  }

  return mergedValue as ShadowProps<Tag>[Key]
}
