/**
 * 这个文件只定义唯一真实 DOM 出口 Piv，负责创建和绑定原生元素。
 * 它不负责业务语义、主题系统、结构包装或组件控制器抽象。
 */
import { isFunction, wrapArr, type AnyFn, type MayArray } from '@edsolater/fnkit'
import { children, createEffect, onCleanup, type Accessor, type JSX } from 'solid-js'
import {
  domMap,
  type CreatePivElement,
  type PivElement,
  type PivSupportedElementTag,
  type PivTag,
} from './domMap'
import { resolveClassName, type ClassName } from './className'

export type RefFunction<T extends Element> = (element?: T) => void 

export type PivDomProps = Record<string, unknown | Accessor<unknown>>

export type PivEvents = Record<
  string,
  EventListenerOrEventListenerObject | Accessor<EventListenerOrEventListenerObject | undefined>
>

export type PivProps<Tag extends PivTag = 'div'> = {
  as: Tag
  class?: ClassName
  props?: PivDomProps
  events?: PivEvents
  ref?: MayArray<RefFunction<PivElement<Tag>> | undefined>
  children?: JSX.Element
}

/**
 * Piv 的普通 props 默认允许 accessor，读取时直接还原当前值。
 */
function readDomValue(value: unknown | Accessor<unknown>): unknown {
  if (typeof value === 'function') {
    return (value as Accessor<unknown>)()
  }

  return value
}

/**
 * 事件既允许直接给 listener，也允许给返回 listener 的 accessor。
 * 这里用函数参数个数区分两种写法，满足当前最小核心用法。
 */
function readEventHandler(
  value: EventListenerOrEventListenerObject | Accessor<EventListenerOrEventListenerObject | undefined>,
): EventListenerOrEventListenerObject | undefined {
  if (typeof value !== 'function') {
    return value
  }

  if (value.length > 0) {
    return value as EventListener
  }

  return (value as Accessor<EventListenerOrEventListenerObject | undefined>)()
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

/**
 * 按 key 语义决定写 attribute 还是 property，不把 DOM 写入逻辑散落到组件主体里。
 */
function setDomProp(element: HTMLElement, key: string, value: unknown) {
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
 * ref 是命令式增强入口，允许单个 ref 或一组 ref，并统一回收清理函数。
 */
function bindRefs<T extends Element>(element: T, refList: PivDomProps['ref']) {
  if (!refList) return

  const refs = wrapArr(refList).filter(isFunction) as RefFunction<T>[]
  const cleanups = refs.map((ref) => ref(element)).filter(isFunction) as unknown as AnyFn[]
  if (cleanups.length === 0) return

  onCleanup(() => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  })
}

/**
 * 模板 ref 只承接 Piv 自己的 DOM 消费入口，不接管元素创建和 children 插入。
 */
export function bindPivElement<Tag extends PivTag>(element: PivElement<Tag>, inputProps: PivProps<Tag>) {
  for (const [key, value] of Object.entries(inputProps.props ?? {})) {
    createEffect(() => {
      setDomProp(element, key, readDomValue(value))
    })
  }

  for (const [eventName, value] of Object.entries(inputProps.events ?? {})) {
    let previousHandler: EventListenerOrEventListenerObject | undefined

    createEffect(() => {
      const nextHandler = readEventHandler(value)

      if (previousHandler) {
        element.removeEventListener(eventName, previousHandler)
      }

      if (nextHandler) {
        element.addEventListener(eventName, nextHandler)
      }

      previousHandler = nextHandler
    })

    onCleanup(() => {
      if (previousHandler) {
        element.removeEventListener(eventName, previousHandler)
      }
    })
  }

  bindRefs(element, inputProps.ref)
}


/**
 * Piv 选择明确模板创建 DOM，props、events、ref 仍由 Piv 自己解释。
 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(inputProps: PivProps<Tag>): JSX.Element {
  const creator = domMap[inputProps.as] 
  const parsedProps = {
    class: inputProps.class != null ? resolveClassName(inputProps.class) : undefined,
    ref: (element: PivElement<Tag>) => bindPivElement(element, inputProps),
    children: inputProps.children,
  }
  return creator(parsedProps)
}

