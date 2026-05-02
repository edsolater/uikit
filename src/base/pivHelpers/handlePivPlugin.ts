/**
 * 这个文件定义 Piv plugin 的展开和合并规则。
 * plugin 可以返回低优先级 shadow props；用户直接传入的 props 始终覆盖 plugin 结果。
 * 它只产出声明数据，不消费 class、style、HTML props、事件或 ref。
 */
import { flapDeep, mergeMayArray, toArray } from '@edsolater/fnkit'
import type { PivProps } from './Piv'
import type { PivTag } from './domMap'

type ShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'as' | 'children'>

export type PivPlugin<Tag extends PivTag, Payload extends any[] = [undefined]> = (
  element: Element,
  payload: Payload,
) => void | ShadowProps<Tag>

/**
 * 按声明顺序执行 plugin，并深度展开 plugin 返回的 plugins。
 */
export function consumePivPlugins<Tag extends PivTag>(
  element: Element,
  originalPlugins: PivProps<Tag>['plugins'],
  payload?: any,
): ShadowProps<Tag>[] {
  let shadowProps: ShadowProps<Tag>[] = []
  let plugins = toArray(originalPlugins).toReversed() // 反转插件数组，保证声明在前的插件优先执行
  if (!plugins) return shadowProps
  while (plugins.length > 0) {
    const plugin = toArray(plugins).pop()!
    if (!plugin) continue
    const result = plugin(element, payload)
    if (result) {
      if (result.plugins) {
        // 返回的 plugins 继续进入同一条深度展开队列，并保持声明顺序。
        plugins.push(...toArray(result.plugins).toReversed())
      }
      delete result.plugins
      shadowProps.push(result)
    }
  }
  return shadowProps
}

/**
 * 合并 plugin shadow props 和用户 props。
 * shadow props 在前，用户 props 在后，因此用户声明天然拥有最高优先级。
 */
export function mergeShadowPropsToPivProps<Tag extends PivTag>(
  shadows: ShadowProps<Tag>[],
  userProps: PivProps<Tag>,
): PivProps<Tag> {
  const propsList = flapDeep([...shadows, userProps])
  return propsList.reduce((lowProps, highProps) => {
    if (!highProps) return lowProps

    for (const key of Object.keys(highProps) as any[]) {
      // @ts-ignore
      const newValue = mergeMayArray(lowProps[key], highProps[key])
      if (newValue !== undefined) {
        // @ts-ignore
        lowProps[key] = newValue
      }
    }
    return lowProps
  }, {} as PivProps<Tag>)
}
