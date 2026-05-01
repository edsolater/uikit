import { type Accessor, createEffect, onCleanup } from 'solid-js'


export type Events = Record<
  string,
  EventListenerOrEventListenerObject | Accessor<EventListenerOrEventListenerObject | undefined>
>

export function parseEvent(element: Element, events: Events) {
  for (const [eventName, callback] of Object.entries(events ?? {})) {
    let previousHandler: EventListenerOrEventListenerObject | undefined

    createEffect(() => {
      const nextHandler = readEventHandler(callback)
      if (previousHandler) element.removeEventListener(eventName, previousHandler)
      if (nextHandler) element.addEventListener(eventName, nextHandler)
      previousHandler = nextHandler
    })
    onCleanup(() => {
      if (previousHandler) element.removeEventListener(eventName, previousHandler)
    })
  }
}

/**
 * 事件既允许直接给 listener，也允许给返回 listener 的 accessor。
 * 这里用函数参数个数区分两种写法，满足当前最小核心用法。
 */
export function readEventHandler(
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
