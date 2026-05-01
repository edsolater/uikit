import { mergeObjectsWithConfigs, shrinkFn, toArray } from '@edsolater/fnkit'
import { createEffect, type Accessor } from 'solid-js'
import type { Accessable, PropValueWrapper } from '../type'
import type { PivHTMLElement, PivTag } from './domMap'

type Value<V> = Accessable<V | undefined>

type PureHTMLProps = Record<string, Value<unknown>>

export type HTMLPropsList = PropValueWrapper<PureHTMLProps>

export function consumeHTMLProps<Tag extends PivTag>(element: PivHTMLElement<Tag>, htmlPropsList: HTMLPropsList) {
  const htmlProps = mergeHTMLProps(htmlPropsList)
  if (!htmlProps) return
  for (const [key, value] of Object.entries(htmlProps)) {
    createEffect(() => {
      setSingleDomProp(element, key, readDomValue(value))
    })
  }
}

/**
 * 合并多个HTMLProps
 */
function mergeHTMLProps(htmlPropsList: HTMLPropsList): PureHTMLProps | undefined {
  const pureHTMLPropsList = toArray(htmlPropsList)
  if (pureHTMLPropsList.length <= 1) return pureHTMLPropsList[0]

  let HTMLPropsBucket: PureHTMLProps = {}
  for (const htmlProps of pureHTMLPropsList) {
    if (!htmlProps) continue
    HTMLPropsBucket = mergeObjectsWithConfigs([HTMLPropsBucket, htmlProps], ({ valueA, valueB }) => {
      if (valueA === undefined) return valueB
      if (valueB === undefined) return valueA
      return [valueA, valueB].flat()
    })
  }
  return HTMLPropsBucket
}
/**
 * Piv 的普通 props 默认允许 accessor，读取时直接还原当前值。
 */

function readDomValue(value: unknown | Accessor<unknown>): unknown {
  return shrinkFn(value)
}

/**
 * 按 key 语义决定写 attribute 还是 property，不把 DOM 写入逻辑散落到组件主体里。
 * TODO： 这里的自动识别机制有问题，比如说布尔值，比如说value属性， 需要特殊处理，这里应学学React
 */
function setSingleDomProp(element: HTMLElement, key: string, value: unknown) {
  if (key === 'style') {
    return setStyleValue(element, value, element.style)
  }

  if (key.startsWith('attr:')) {
    const attributeName = key.slice(5)

    if (value == null || value === false) {
      element.removeAttribute(attributeName)
      return
    }

    element.setAttribute(attributeName, String(value))
    return
  }

  if (key.startsWith('prop:')) {
    const propertyName = key.slice(5)
    ;(element as unknown as Record<string, unknown>)[propertyName] = value
    return
  }

  if (key in element) {
    ;(element as HTMLElement & Record<string, unknown>)[key] = value
    return
  }

  if (value == null || value === false) {
    element.removeAttribute(key)
    return
  }

  element.setAttribute(key, String(value))
}

/**
 * style 作为特殊 DOM 能力，需要负责移除旧字段并写入新字段。
 */
function setStyleValue(element: HTMLElement, value: unknown, previousStyle: CSSStyleDeclaration | null) {
  if (typeof value === 'string') {
    element.style.cssText = value
    return null
  }

  if (!value || typeof value !== 'object') {
    element.removeAttribute('style')
    return null
  }

  const nextStyle = value as Record<string, string | null | undefined>

  if (previousStyle) {
    for (const key of Array.from(previousStyle)) {
      if (!(key in nextStyle)) {
        element.style.removeProperty(key)
      }
    }
  }

  for (const [key, styleValue] of Object.entries(nextStyle)) {
    if (styleValue == null || styleValue === '') {
      element.style.removeProperty(key)
      continue
    }

    element.style.setProperty(key, styleValue)
  }

  return element.style
}
