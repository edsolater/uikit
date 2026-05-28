/**
 * 这个文件消费 Piv 的普通 HTML props。
 * class、style、事件、children 和 ref 都有专用入口；这里保留的是原生 HTML 字段与 attr: / prop: 逃生口。
 * 同名 key 按后声明覆盖，避免被覆盖来源继续参与响应式订阅。
 */
import { mergeObjects, mergeObjectsWithConfigs, toArray, type MayArray, isString, isExist } from '@edsolater/fnkit'
import type { JSX } from 'solid-js'
import { createRenderEffect } from 'solid-js'
import { val, type Source } from '../../hooks'
import type { PivHTMLElement, PivTag } from './domMap'
import { setSingleDomProp, type HTMLPropAtom } from './handleHTMLPropsValue'

/* 直接可以使用 `pivProps` ，所以应该被禁止 */
type ReservedHTMLPropKey = 'class' | 'className' | 'style' | 'children' | 'ref' | `on${string}` | `on:${string}`

/* 允许使用的 `HTMLprops` */
type KnownHTMLPropKey<Tag extends PivTag> = Exclude<keyof JSX.IntrinsicElements[Tag], ReservedHTMLPropKey>
type HTMLValue<Value> = Value | null | undefined

type PatchedIntrinsicHTMLPropValue<Tag extends PivTag, Key extends KnownHTMLPropKey<Tag>> = Key extends 'popover'
  ? JSX.IntrinsicElements[Tag][Key] | 'hint'
  : JSX.IntrinsicElements[Tag][Key]

type HTMLPropsRecord<Tag extends PivTag = 'div'> = {
  [Key in KnownHTMLPropKey<Tag>]?: Source<HTMLValue<PatchedIntrinsicHTMLPropValue<Tag, Key>>>
} & {
  [key: `attr:${string}`]: Source<HTMLPropAtom> | undefined
  [key: `prop:${string}`]: Source<HTMLPropAtom> | undefined
  [key: string]: Source<HTMLPropAtom> | undefined
}

export type HTMLPropsList<Tag extends PivTag = 'div'> = MayArray<HTMLPropsRecord<Tag> | undefined>

export function consumeHTMLProps<Tag extends PivTag>(element: PivHTMLElement<Tag>, htmlPropsList: HTMLPropsList<Tag>) {
  const htmlPropRecord = merglyParseHTMLPropsLists(htmlPropsList)
  if (!htmlPropRecord) return
  for (const [key, atom] of Object.entries(htmlPropRecord)) {
    if (isEventPropKey(key)) {
      continue
    }

    setSingleDomProp(element, key, atom)
  }
}

function isEventPropKey(key: string) {
  return key.startsWith('on:') || (key.startsWith('on') && key.length > 2)
}

/**
 * 普通 HTML props 不做数组级 fallback；同名字段由后声明者接管。
 */
function merglyParseHTMLPropsLists<Tag extends PivTag>(
  htmlPropsList: HTMLPropsList<Tag>,
): HTMLPropsRecord<Tag> | undefined {
  const pureHTMLPropsList = toArray(htmlPropsList)
  if (pureHTMLPropsList.length <= 1) return pureHTMLPropsList[0]
  return mergeObjectsWithConfigs(pureHTMLPropsList, ({ key, valueA, valueB }) => {
    if (isExist(valueA) && isExist(valueB)) {
      return [valueA, valueB].flat()
    }
    return valueB ?? valueA
  })
}
