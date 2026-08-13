/**
 * 这个文件消费 Piv 的普通 HTML props。
 * class、style、事件、children 和 ref 都有专用入口；这里保留的是原生 HTML 字段与 attr: / prop: 逃生口。
 * 同名 key 按后声明覆盖，避免被覆盖来源继续参与响应式订阅。
 */
import { isTruthy, toArray } from '@edsolater/fnkit'
import { createRenderEffect, onCleanup, type JSX } from 'solid-js'
import { val, type MayArraySource } from '../../../hooks'
import type { PivHTMLElement, PivTag } from './domMap'
import {
  setSingleDomProp,
  type HTMLPropAtom,
  type HTMLPropPrimitive,
} from './handleHTMLPropsValue'

/** 已有专用 Piv prop 的字段禁止从 htmlProps 重复进入 DOM。 */
type ReservedHTMLPropKey = 'id' | 'class' | 'className' | 'style' | 'children' | 'ref' | `on${string}` | `on:${string}`

type KnownHTMLPropKey<Tag extends PivTag> = Exclude<keyof JSX.IntrinsicElements[Tag], ReservedHTMLPropKey>

type HTMLPropsRecord<Tag extends PivTag = 'div'> = {
  [Key in KnownHTMLPropKey<Tag>]?: HTMLPropAtom<JSX.IntrinsicElements[Tag][Key]>
} & {
  [key: `attr:${string}`]: HTMLPropAtom<HTMLPropPrimitive> | undefined
  [key: `prop:${string}`]: HTMLPropAtom<HTMLPropPrimitive> | undefined
  [key: string]: HTMLPropAtom<unknown> | undefined
}

/** 一份完整 HTML props 声明；外层 Source 可以整体替换记录或记录列表。 */
export type HTMLPropsList<Tag extends PivTag = 'div'> = MayArraySource<HTMLPropsRecord<Tag>>

/**
 * 消费整合后的普通 HTML props，选择同名字段的最终值并维护 DOM 清理。
 */
export function consumeHTMLProps<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  readHTMLPropsList: () => HTMLPropsList<Tag> | undefined,
) {
  createRenderEffect(() => {
    const htmlPropsList = toArray(val(readHTMLPropsList()))
      .map((htmlProps) => val(htmlProps))
      .filter(isTruthy)
    const htmlPropEntries = readActiveHTMLPropEntries(htmlPropsList)
    const restoreDOMProps: (() => void)[] = []

    for (const [key, atom] of htmlPropEntries) {
      if (isReservedHTMLPropKey(key)) continue
      restoreDOMProps.push(setSingleDomProp(element, key, atom))
    }

    onCleanup(() => {
      for (const restoreDOMProp of restoreDOMProps) {
        restoreDOMProp()
      }
    })
  })
}

function isReservedHTMLPropKey(key: string) {
  return key === 'id'
    || key === 'class'
    || key === 'className'
    || key === 'style'
    || key === 'children'
    || key === 'ref'
    || key.startsWith('on:')
    || (key.startsWith('on') && key.length > 2)
}

/**
 * 从高优先级记录开始寻找每个字段的有效声明，被覆盖的字段值不会被读取或订阅。
 */
function readActiveHTMLPropEntries<Tag extends PivTag>(
  htmlPropsList: HTMLPropsRecord<Tag>[],
): [key: string, atom: HTMLPropAtom][] {
  const keys = new Set(htmlPropsList.flatMap((htmlProps) => Object.keys(htmlProps)))
  const entries: [key: string, atom: HTMLPropAtom][] = []

  for (const key of keys) {
    for (let index = htmlPropsList.length - 1; index >= 0; index--) {
      const atom = htmlPropsList[index][key]
      if (atom === undefined) continue
      entries.push([key, atom as HTMLPropAtom])
      break
    }
  }

  return entries
}
