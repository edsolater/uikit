import { toArray } from '@edsolater/fnkit'
import { createRenderEffect } from 'solid-js'
import type { PropValueWrapper } from '../type'
import type { PivHTMLElement, PivTag } from './domMap'
import { setSingleDomProp, type HTMLPropValue } from './handleHTMLPropsValue'

type PureHTMLProps = Record<string, HTMLPropValue>

export type HTMLPropsList = PropValueWrapper<PureHTMLProps>

export function consumeHTMLProps<Tag extends PivTag>(element: PivHTMLElement<Tag>, htmlPropsList: HTMLPropsList) {
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
function mergeHTMLProps(htmlPropsList: HTMLPropsList): PureHTMLProps | undefined {
  const pureHTMLPropsList = toArray(htmlPropsList)
  if (pureHTMLPropsList.length <= 1) return pureHTMLPropsList[0]

  const htmlPropsBucket: PureHTMLProps = {}
  for (const htmlProps of pureHTMLPropsList) {
    if (!htmlProps) continue
    Object.assign(htmlPropsBucket, htmlProps)
  }
  return htmlPropsBucket
}
