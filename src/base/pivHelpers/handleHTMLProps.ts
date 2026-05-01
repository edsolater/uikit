import { toArray } from '@edsolater/fnkit'
import { createRenderEffect } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'
import type { PropValueWrapper } from '../type'
import type { PivHTMLElement, PivTag } from './domMap'
import { setSingleDomProp, type HTMLPropValue } from './handleHTMLPropsValue'

type ReservedHTMLPropKey = 'class' | 'className' | 'style' | 'children' | 'ref' | `on${string}` | `on:${string}`
type KnownHTMLPropKey<Tag extends PivTag> = Exclude<keyof JSX.IntrinsicElements[Tag], ReservedHTMLPropKey>
type KnownHTMLPropValue<Value> = Value | Accessor<Value | null | undefined> | null | undefined

type PureHTMLProps<Tag extends PivTag = 'div'> = {
  [Key in KnownHTMLPropKey<Tag>]?: KnownHTMLPropValue<JSX.IntrinsicElements[Tag][Key]>
} & {
  [key: `attr:${string}`]: HTMLPropValue | undefined
  [key: `prop:${string}`]: HTMLPropValue | undefined
  [key: string]: HTMLPropValue | undefined
}

export type HTMLPropsList<Tag extends PivTag = 'div'> = PropValueWrapper<PureHTMLProps<Tag>>

export function consumeHTMLProps<Tag extends PivTag>(element: PivHTMLElement<Tag>, htmlPropsList: HTMLPropsList<Tag>) {
  const htmlProps = mergeHTMLProps(htmlPropsList)
  if (!htmlProps) return
  for (const [key, value] of Object.entries(htmlProps)) {
    createRenderEffect(() => {
      setSingleDomProp(element, key, value)
    })
  }
}

/**
 * 普通 HTML props 按 key 覆盖，后声明的 props 接管同名 DOM 字段。
 */
function mergeHTMLProps<Tag extends PivTag>(htmlPropsList: HTMLPropsList<Tag>): PureHTMLProps<Tag> | undefined {
  const pureHTMLPropsList = toArray(htmlPropsList)
  if (pureHTMLPropsList.length <= 1) return pureHTMLPropsList[0]

  const htmlPropsBucket: PureHTMLProps<Tag> = {}
  for (const htmlProps of pureHTMLPropsList) {
    if (!htmlProps) continue
    Object.assign(htmlPropsBucket, htmlProps)
  }
  return htmlPropsBucket
}
