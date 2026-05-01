import { shrinkFn } from '@edsolater/fnkit'
import type { Accessor } from 'solid-js'

// 不可约的 atom 类型，或者说是最终能写入 DOM 的值类型
type HTMLPropAtom = string | number | boolean | null | undefined | object
export type HTMLPropValue = HTMLPropAtom | Accessor<HTMLPropAtom>

/**
 * 按 key 语义决定写 attribute 还是 property，不把 DOM 写入逻辑散落到组件主体里。
 * 普通 HTML prop 已经在外层按 key 覆盖，这里只读取当前字段自己的值。
 */
export function setSingleDomProp(element: HTMLElement, key: string, value: HTMLPropValue) {
  const domValue = shrinkFn(value)

  if (key === 'style') {
    setStyleValue(element, domValue)
    return
  }

  if (key.startsWith('attr:')) {
    const attributeName = key.slice(5)
    setAttributeValue(element, attributeName, domValue)
    return
  }

  if (key.startsWith('prop:')) {
    const propertyName = key.slice(5)
    setPropertyValue(element, propertyName, domValue)
    return
  }

  if (isAttributeOnlyKey(key)) {
    setAttributeValue(element, key, domValue)
    return
  }

  if (key in element) {
    setPropertyValue(element, key, domValue)
    return
  }

  setAttributeValue(element, key, domValue)
}

/**
 * data 和 aria 是 HTML attribute 语义，不参与 DOM property 自动探测。
 */
function isAttributeOnlyKey(key: string) {
  return key.startsWith('data-') || key.startsWith('aria-')
}

/**
 * attribute 的空值语义是移除，false 也按没有该 attribute 处理。
 */
function setAttributeValue(element: HTMLElement, key: string, value: HTMLPropAtom) {
  if (value == null || value === false) {
    element.removeAttribute(key)
    return
  }

  element.setAttribute(key, String(value))
}

/**
 * property 写入只处理 DOM 自身支持的属性；空值是否有效由对应 property 自己承接。
 */
function setPropertyValue(element: HTMLElement, key: string, value: HTMLPropAtom) {
  ;(element as unknown as Record<string, HTMLPropAtom>)[key] = value
}

/**
 * style 作为特殊 DOM 能力，当前绑定独占 inline style。
 */
function setStyleValue(element: HTMLElement, value: HTMLPropAtom) {
  if (typeof value === 'string') {
    element.style.cssText = value
    return
  }

  if (!value || typeof value !== 'object') {
    element.removeAttribute('style')
    return
  }

  const nextStyle = value as Record<string, string | null | undefined>

  for (const key of Array.from(element.style)) {
    if (!(key in nextStyle)) {
      element.style.removeProperty(key)
    }
  }

  for (const [key, styleValue] of Object.entries(nextStyle)) {
    if (styleValue == null || styleValue === '') {
      element.style.removeProperty(key)
      continue
    }

    element.style.setProperty(key, styleValue)
  }
}
