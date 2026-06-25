/**
 * 这个文件定义 Piv plugin 的展开和合并规则。
 * plugin 可以返回低优先级 shadow props；用户直接传入的 props 始终覆盖 plugin 结果。
 * 它只产出声明数据，不消费 class、style、HTML props、事件或 ref。
 */
import { flapDeep, mergeMayArray, toArray, mayMap } from '@edsolater/fnkit'
import type { PivProps } from '../Piv'
import type { PivHTMLElement, PivTag } from '../domMap'
import { runPlugin, type PivPlugin } from './runPlugin'

export type ShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'as' | 'if' | 'children'>

export type ComsumedShadowProps<Tag extends PivTag> = Omit<
  PivProps<Tag>,
  'as' | 'if' | 'children' | 'plugins' | 'trait' | 'shadowProps'
>



/**
 * 按声明顺序执行 plugin，并深度展开 plugin 返回的 plugins。
 */
export function consumePivPlugins<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  props: ShadowProps<Tag>,
): ComsumedShadowProps<Tag> {
  let shadowProps: ComsumedShadowProps<Tag>[] = [props] // 越排名后期的plugin越先被解析 // 纳入这一队列的props全都认为不需要进一步解析了
  let pluginsQueue: PivPlugin<Tag>[] = getPluginFromShadowProps(props)

  while (pluginsQueue.length > 0) {
    const plugin = pluginsQueue.pop()
    if (!plugin) continue
    const result = runPlugin(plugin, element)
    if (result) {
      const newDeepQueueFromResult = getPluginFromShadowProps(result)
      pluginsQueue.push(...newDeepQueueFromResult)
      shadowProps.push(result)
    }
  }

  return mergeConsumedShadowProps(shadowProps)
}

/**
 *
 * @param props 可能含有plugins shadowProps traits 的props
 * @returns
 */
function getPluginFromShadowProps<Tag extends PivTag>(props: ShadowProps<Tag>): PivPlugin<Tag>[] {
  return toArray(
    props.trait,
    mayMap(props.shadowProps, (shadow) => () => shadow),
    props.plugins,
  )
}

/**
 * 合并一系列 plugin 产出的 shadow props 和用户 props。
 * @param shadowPropsList 一系列 可能含有plugins shadowProps traits 的props
 * @returns  合并后的单一shadowprops
 */
function mergeConsumedShadowProps<Tag extends PivTag>(
  shadowPropsList: ComsumedShadowProps<Tag>[],
): ComsumedShadowProps<Tag> {
  return shadowPropsList.toReversed().reduce((collectProps, singleProps) => {
    for (const key of Object.keys(singleProps) as (keyof PivProps<Tag>)[]) {
      if (key === 'as' || key === 'if' || key === 'children' || key === 'plugins' || key === 'trait' || key === 'shadowProps') continue
      const newValue = mergeMayArray(collectProps[key], singleProps[key])
      // @ts-ignore
      collectProps[key] = newValue
    }
    return collectProps
  }, {} as ComsumedShadowProps<Tag>)
}
