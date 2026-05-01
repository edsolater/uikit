/**
 * 这个文件定义普通 HTML prop 的单字段写入规则。
 * 上游已经完成 props 合并和响应式订阅；这里只决定 attribute、property、attr:*、prop:* 的落点。
 * class、style 和事件不进入这个通道。
 */
import { shrinkFn } from '@edsolater/fnkit'
import type { Accessor } from 'solid-js'

// 已经进入 DOM 写入边界的终端值，不再在这里做业务类型细分。
type HTMLPropAtom = string | number | boolean | null | undefined | object
export type HTMLPropValue = HTMLPropAtom | Accessor<HTMLPropAtom>

/**
 * 按 key 语义写入 DOM。
 * data-* 和 aria-* 固定走 attribute；其他普通 key 才允许 property 探测。
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
 * property 空值语义交给 DOM 自身承接，不在这里模拟 attribute remove。
 */
function setPropertyValue(element: HTMLElement, key: string, value: HTMLPropAtom) {
  ;(element as unknown as Record<string, HTMLPropAtom>)[key] = value
}

/**
 * 兼容误入 htmlProps 的 style；正常 style 应走 Piv 的 style 专用入口。
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
