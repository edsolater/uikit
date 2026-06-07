/**
 * 这个文件定义普通 HTML prop 的单字段写入规则。
 * 上游已经完成 props 合并和响应式订阅；这里只决定 attribute、property、attr:*、prop:* 的落点。
 * class、style 和事件不进入这个通道。
 */

import { isArray, isFunction, isObject, result, type MayArray } from '@edsolater/fnkit'
import { createComputed, createSignal } from 'solid-js'
import { val, type Source } from '../../hooks'

// 已经进入 DOM 写入边界的终端值，不再在这里做业务类型细分。
type HTMLPropPrimitive = string | number | boolean | null | undefined
export type HTMLPropAtomValue<Raw = HTMLPropPrimitive> = Raw | ((prev?: Raw) => Raw) | { mergable: Raw } // TODO: autoMerge显式自动合并
export type HTMLPropAtom<Raw = HTMLPropPrimitive> = Source<MayArray<Source<HTMLPropAtomValue<Raw>>>>

/**
 * 按 key 语义写入 DOM。
 * data-* 和 aria-* 固定走 attribute；其他普通 key 才允许 property 探测。
 */
export function setSingleDomProp(element: HTMLElement, key: string, atom: HTMLPropAtom) {
  if (key.startsWith('attr:')) {
    const attributeName = key.slice(5)
    handleHTMLSetAction(atom, {
      runEffect: (v) => {
        setAttributeValue(element, attributeName, v)
      },
    })
    return
  }

  if (key.startsWith('prop:')) {
    const propertyName = key.slice(5)
    handleHTMLSetAction(atom, {
      runEffect: (v) => {
        setPropertyValue(element, propertyName, v)
      },
    })
    return
  }

  if (isAttributeOnlyKey(key)) {
    // data- 和 aria- 固定走 attribute，且是可以合并的字符串
    handleHTMLSetAction(atom, {
      runEffect: (v) => {
        setAttributeValue(element, key, v)
      },
    })
    return
  }

  if (key in element) {
    handleHTMLSetAction(atom, {
      runEffect: (v) => {
        setPropertyValue(element, key, v)
      },
    })
    return
  }

  handleHTMLSetAction(atom, {
    runEffect: (v) => {
      setAttributeValue(element, key, v)
    },
  })
}

function handleHTMLSetAction(
  atom: HTMLPropAtom,
  options: {
    runEffect: (val: HTMLPropPrimitive) => void // 解析出 value 后的操作
  },
): void {
  const [activePrimitive, setActivePrimitive] = createSignal<HTMLPropPrimitive>()

  createComputed(() => {
    const values = val(atom)
    if (!isArray(values)) {
      const inputValue = val(values)
      const newPrimitive = parseHTMLPropertyValue(inputValue)
      setActivePrimitive(newPrimitive)
    } else {
      for (const htmlValue of values) {
        createComputed(() => {
          const inputValue = val(htmlValue)
          setActivePrimitive((prevStoredValue) => {
            const newPrimitive = parseHTMLPropertyValue(inputValue, prevStoredValue)
            return newPrimitive
          })
        })
      }
    }
  })

  createComputed(() => {
    options.runEffect(activePrimitive())
  })
}

/**
 * 解析 HTMLValue (函数会自动调用)
 *
 * TODO：数组会自动合并
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
