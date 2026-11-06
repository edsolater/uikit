/**
 * 这个文件消费 Piv 的普通 HTML props。
 * class、style、事件、children 和 domRef 都有专用入口；这里保留的是原生 HTML 字段与 attr: / prop: 逃生口。
 * 同名 key 按声明顺序处理；普通值覆盖，显式合并和函数可读取前值。
 */
import { type JSX, val, type MayArraySource } from '@/foundation'
import { mapArray } from '@/foundation/render'
import { createMemo } from '@/foundation/reactivity'
import { isTruthy, toArray } from '@edsolater/fnkit'
import type { PivHTMLElement, PivTag } from './domMap'
import {
  consumeHTMLProp,
  type HTMLPropAtom,
  type HTMLPropPrimitive,
} from './handleHTMLPropsValue'

/** 已有专用 Piv prop 的字段禁止从 htmlProps 重复进入 DOM。 */
type ReservedHTMLPropKey =
  | 'id'
  | 'class'
  | 'className'
  | 'style'
  | 'children'
  | 'domRef'
  | `on${string}`
  | `on:${string}`

type KnownHTMLPropKey<Tag extends PivTag> = Exclude<
  keyof JSX.IntrinsicElements[Tag],
  keyof JSX.IntrinsicAttributes | ReservedHTMLPropKey
>

type HTMLPropsRecord<Tag extends PivTag = 'div'> = {
  [Key in KnownHTMLPropKey<Tag>]?: HTMLPropAtom<JSX.IntrinsicElements[Tag][Key]>
} & {
  [key: `attr:${string}`]: HTMLPropAtom<HTMLPropPrimitive> | undefined
  [key: `prop:${string}`]: HTMLPropAtom<HTMLPropPrimitive> | undefined
  [key: string]: HTMLPropAtom<unknown> | undefined
}

/** 一份完整 HTML props 声明；外层 Source 可以整体替换记录或记录列表。 */
export type HTMLPropsList<Tag extends PivTag = 'div'> = MayArraySource<
  HTMLPropsRecord<Tag>
>

/**
 * 消费整合后的普通 HTML props，选择同名字段的最终值并维护 DOM 清理。
 */
export function consumeHTMLProps<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  readHTMLPropsList: () => HTMLPropsList<Tag> | undefined,
) {
  const activeProps = createMemo(() => {
    const htmlPropsList = toArray(val(readHTMLPropsList()))
      .map((htmlProps) => val(htmlProps))
      .filter(isTruthy)
    return htmlPropsList
  })

  // 同 key 的监听随来源变化持续存在；字段退出时由原生列表作用域释放本轮绑定。
  mapArray(
    () => {
      const sources = activeProps()
      return [
        ...new Set(sources.flatMap((props) => Object.keys(props))),
      ].filter(
        (key) =>
          !isReservedHTMLPropKey(key) &&
          sources.some(
            (_, index) =>
              sources[sources.length - index - 1][key] !== undefined,
          ),
      )
    },
    (key) => {
      consumeHTMLProp(element, key, () =>
        activeProps().map(
          (props) => () => props[key] as HTMLPropAtom | undefined,
        ),
      )
      return key
    },
  )
}

function isReservedHTMLPropKey(key: string) {
  return (
    key === 'id' ||
    key === 'class' ||
    key === 'className' ||
    key === 'style' ||
    key === 'children' ||
    key === 'domRef' ||
    key.startsWith('on:') ||
    (key.startsWith('on') && key.length > 2)
  )
}
