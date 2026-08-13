/**
 * 这个文件定义普通 HTML prop 的单字段写入规则。
 * 上游已经选出每个字段的有效声明；这里读取字段 Source，并决定 attribute、property、attr:*、prop:* 的落点。
 * class、style 和事件不进入这个通道。
 */

import { isArray, isFunction, isObject, result } from '@edsolater/fnkit'
import { createRenderEffect } from 'solid-js'
import { val, type MayArraySource } from '../../../hooks'

// 已经进入 DOM 写入边界的终端值，不再在这里做业务类型细分。
export type HTMLPropPrimitive = string | number | boolean | null | undefined

/**
 * 一个 HTML 字段的单项声明。
 * 普通值直接覆盖；函数根据前一项结果计算；mergable 只有显式使用时才按空格拼接。
 */
export type HTMLPropAtomValue<Raw = HTMLPropPrimitive> = Raw | ((prev?: Raw) => Raw) | { mergable: Raw }

/** 一个 HTML 字段的完整动态声明，支持整体 Source、值列表及列表内的单项 Source。 */
export type HTMLPropAtom<Raw = HTMLPropPrimitive> = MayArraySource<HTMLPropAtomValue<Raw>>

/**
 * 按 key 语义写入 DOM。
 * data-* 和 aria-* 固定走 attribute；其他普通 key 才允许 property 探测。
 * 返回恢复函数，供上层在动态声明消失或组件清理时恢复绑定前的 DOM 值。
 */
export function setSingleDomProp(element: HTMLElement, key: string, atom: HTMLPropAtom) {
  const binding = createDOMPropBinding(element, key)
  consumeHTMLPropAtom(atom, binding.writeValue)
  return binding.restoreValue
}

/**
 * 根据 key 决定 attribute 或 property 落点，并记录绑定前的 DOM 值。
 * 动态声明消失时恢复原值，避免把 value 一类 DOMString property 清成字符串 "undefined"。
 */
function createDOMPropBinding(
  element: HTMLElement,
  key: string,
): {
  writeValue: (value: HTMLPropPrimitive) => void
  restoreValue: () => void
} {
  if (key.startsWith('attr:')) {
    return createAttributeBinding(element, key.slice(5))
  }

  if (key.startsWith('prop:')) {
    return createPropertyBinding(element, key.slice(5))
  }

  if (isAttributeOnlyKey(key) || !(key in element)) {
    return createAttributeBinding(element, key)
  }

  return createPropertyBinding(element, key)
}

/** attribute 清理时恢复绑定前的存在状态和值。 */
function createAttributeBinding(element: HTMLElement, key: string) {
  const hadAttribute = element.hasAttribute(key)
  const previousValue = element.getAttribute(key)
  return {
    writeValue: (value: HTMLPropPrimitive) => {
      setAttributeValue(element, key, value)
    },
    restoreValue: () => {
      if (hadAttribute) {
        element.setAttribute(key, previousValue ?? '')
      } else {
        element.removeAttribute(key)
      }
    },
  }
}

/** property 清理时恢复绑定前由 DOM 提供的初始值。 */
function createPropertyBinding(element: HTMLElement, key: string) {
  const previousValue = (element as unknown as Record<string, HTMLPropPrimitive>)[key]
  return {
    writeValue: (value: HTMLPropPrimitive) => {
      setPropertyValue(element, key, value)
    },
    restoreValue: () => {
      setPropertyValue(element, key, previousValue)
    },
  }
}

/** 响应式读取单字段声明，并把归一后的终端值交给对应 DOM 写入函数。 */
function consumeHTMLPropAtom(
  atom: HTMLPropAtom,
  writeValue: (value: HTMLPropPrimitive) => void,
): void {
  createRenderEffect(() => {
    const values = val(atom)
    let activePrimitive: HTMLPropPrimitive

    for (const htmlValue of isArray(values) ? values : [values]) {
      activePrimitive = parseHTMLPropertyValue(val(htmlValue), activePrimitive)
    }

    writeValue(activePrimitive)
  })
}

/**
 * 解析 HTMLValue (函数会自动调用)
 *
 *
 * ** 不能要未申明的“智能”合并，因为按规则自动合并而非覆盖，会有额外的心智负担
 */
function parseHTMLPropertyValue(newVal: HTMLPropAtomValue, oldPrimitive?: HTMLPropPrimitive): HTMLPropPrimitive {
  let newPrimitive: HTMLPropPrimitive
  if (isObject(newVal) && 'mergable' in newVal) {
    newPrimitive = oldPrimitive ? `${oldPrimitive} ${newVal.mergable}` : newVal.mergable
  } else if (isFunction(newVal)) {
    newPrimitive = result(newVal, oldPrimitive)
  } else {
    newPrimitive = newVal
  }
  return newPrimitive
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
function setAttributeValue(element: HTMLElement, key: string, value: HTMLPropPrimitive) {
  if (value == null || value === false) {
    element.removeAttribute(key)
    return
  }

  element.setAttribute(key, String(value))
}

/**
 * property 空值语义交给 DOM 自身承接，不在这里模拟 attribute remove。
 */
function setPropertyValue(element: HTMLElement, key: string, value: HTMLPropPrimitive) {
  ;(element as unknown as Record<string, HTMLPropPrimitive>)[key] = value
}
