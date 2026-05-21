/**
 * 这个文件消费 Piv 的普通 HTML props。
 * class、style、事件、children 和 ref 都有专用入口；这里保留的是原生 HTML 字段与 attr: / prop: 逃生口。
 * 同名 key 按后声明覆盖，避免被覆盖来源继续参与响应式订阅。
 */
import { toArray, type MayArray } from '@edsolater/fnkit'
import type { JSX } from 'solid-js'
import { createRenderEffect } from 'solid-js'
import { val, type Source } from '../../hooks'
import type { PivHTMLElement, PivTag } from './domMap'
import { setSingleDomProp, type HTMLPropAtom } from './handleHTMLPropsValue'

type ReservedHTMLPropKey = 'class' | 'className' | 'style' | 'children' | 'ref' | `on${string}` | `on:${string}`
type KnownHTMLPropKey<Tag extends PivTag> = Exclude<keyof JSX.IntrinsicElements[Tag], ReservedHTMLPropKey>
type KnownHTMLPropAtom<Value> = Value | null | undefined
type PatchedIntrinsicHTMLPropValue<Tag extends PivTag, Key extends KnownHTMLPropKey<Tag>> = Key extends 'popover'
  ? JSX.IntrinsicElements[Tag][Key] | 'hint'
  : JSX.IntrinsicElements[Tag][Key]

type PureHTMLProps<Tag extends PivTag = 'div'> = {
  [Key in KnownHTMLPropKey<Tag>]?: Source<KnownHTMLPropAtom<PatchedIntrinsicHTMLPropValue<Tag, Key>>>
} & {
  [key: `attr:${string}`]: Source<HTMLPropAtom> | undefined
  [key: `prop:${string}`]: Source<HTMLPropAtom> | undefined
  [key: string]: Source<HTMLPropAtom> | undefined
}

export type HTMLPropsList<Tag extends PivTag = 'div'> = MayArray<PureHTMLProps<Tag> | undefined>

export function consumeHTMLProps<Tag extends PivTag>(element: PivHTMLElement<Tag>, htmlPropsList: HTMLPropsList<Tag>) {
  const htmlProps = mergeHTMLProps(htmlPropsList)
  if (!htmlProps) return
  for (const [key, value] of Object.entries(htmlProps)) {
    if (isEventPropKey(key)) {
      continue
    }

    createRenderEffect(() => {
      const atom = val(value) as HTMLPropAtom
      if (atom === undefined) return
      setSingleDomProp(element, key, atom)
    })
  }
}

function isEventPropKey(key: string) {
  return key.startsWith('on:') || (key.startsWith('on') && key.length > 2)
}

/**
 * 普通 HTML props 不做数组级 fallback；同名字段由后声明者接管。
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
