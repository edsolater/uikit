import { flapDeep, mergeMayArray, toArray } from '@edsolater/fnkit'
import type { PivProps } from '../Piv'
import type { PivTag } from './domMap'

type ShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'as' | 'children'>

export type PivPlugin<Tag extends PivTag, Payload extends any[] = [undefined]> = (
  element: Element,
  payload: Payload,
) => void | ShadowProps<Tag>

/**
 *
 * @param element
 * @param plugin
 * @param payload
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
        plugins.push(...toArray(result.plugins).toReversed()) // 插件返回的 plugins 也需要反转后加入执行队列
      }
      delete result.plugins
      shadowProps.push(result)
    }
  }
  return shadowProps
}

/**
 * 合并PivProps， shadowProps优先级更低
 * @param base
 * @param shadow
 * @returns
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
