import { shrinkFn } from '@edsolater/fnkit'
import { createEffect, type Accessor } from 'solid-js'
import type { PivDomProps } from '../Piv'
import type { PivTag, PivElement } from './domMap'

export function parseDomProps<Tag extends PivTag>(
  element: PivElement<Tag>,
  props: PivDomProps,
) {
  for (const [key, value] of Object.entries(props)) {
    createEffect(() => {
      setSingleDomProp(element, key, readDomValue(value))
    })
  }
}
/**
 * Piv 的普通 props 默认允许 accessor，读取时直接还原当前值。
 */

function readDomValue(value: unknown | Accessor<unknown>): unknown {
  return shrinkFn(value)
}

/**
 * 按 key 语义决定写 attribute 还是 property，不把 DOM 写入逻辑散落到组件主体里。
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
