/**
 * 这个文件只负责把 Piv 声明的静态事件表绑定到真实 DOM。
 * 它不负责响应式替换 listener，也不解释业务状态何时应该更换事件语义。
 */
import { toArray, type MayArray } from '@edsolater/fnkit'
import { onCleanup } from 'solid-js'
import type { PropValueWrapper } from '../type'

type EventKey = keyof GlobalEventHandlersEventMap

type CleanupCallback = () => void

type ListenerCallback<K extends EventKey> = (event: GlobalEventHandlersEventMap[K]) => void | CleanupCallback

interface BaseListenerDiscriptor<K extends EventKey> {
  once?: boolean
  capture?: boolean
  passive?: boolean
  callback: ListenerCallback<K>
  // 如果指定了 cleanup，则忽略 callback 返回的 cleanup，改为在事件解绑时调用这个 cleanup。
  cleanup?: () => void
}

interface ListenerDiscriptor<K extends EventKey> extends BaseListenerDiscriptor<K> {
  // 事件名，允许不带 on 前缀，直接写 click 而不是 onClick。
  event: K
}

type ListenerDiscriptPair<K extends EventKey> = [
  event: K,
  baseDiscriptor: MayArray<BaseListenerDiscriptor<K> | ListenerDiscriptor<K>>,
]

type ListenerDiscriptMap<K extends EventKey> = Partial<
  Record<K, MayArray<BaseListenerDiscriptor<K> | ListenerDiscriptor<K>>>
>

// 综合上述三种事件描述方式，允许直接传函数，也允许传入包含选项的对象。
type EventListener<K extends EventKey = EventKey> =
  | ListenerDiscriptor<K>
  | ListenerDiscriptPair<K>
  | ListenerDiscriptMap<K>

export type EventListeners<K extends EventKey = EventKey> = PropValueWrapper<EventListener<K>>

/**
 * 把 `on` 支持的多种声明形状压平成统一的 descriptor 列表。
 * 这个函数只负责把输入改写成 `event + callback + options` 的固定结构，
 * 不在这里触碰 DOM，也不处理 cleanup 的执行时机。
 *
 * 当前支持的输入形式：
 * - 单个 descriptor：`{ event: 'click', callback: handleClick }`
 * - 事件-描述对：`['click', { callback: handleClick }]`
 * - 事件映射：`{ click: { callback: handleClick } }`
 * - 上述任意形式的数组，以及单个事件下的多个 descriptor。
 */
function toListenerDiscriptor<K extends EventKey>(eventListeners: EventListeners): ListenerDiscriptor<K>[] {
  const eventListenerList = toArray(eventListeners).filter(Boolean) as EventListener<K>[]
  return eventListenerList.flatMap((listener) => {
    if (Array.isArray(listener)) {
      const [event, baseDiscriptors] = listener
      return toArray(baseDiscriptors).map((baseDiscriptor) => ({
        event,
        ...baseDiscriptor,
      }))
    }

    if ('event' in listener) {
      return [listener]
    }

    return (Object.entries(listener) as [K, ListenerDiscriptMap<K>[K]][]).flatMap(([event, baseDiscriptor]) => {
      if (!baseDiscriptor) {
        return []
      }
      return toArray(baseDiscriptor).map((baseDiscriptor) => ({
        event,
        ...baseDiscriptor,
      }))
    })
  })
}

/**
 * 把 `on` 的声明整体挂到目标 DOM 上。
 * 这个函数只做两件事：先规范化输入，再逐条注册；
 * 具体某个 listener 如何绑定和回收，交给下游的单条注册函数处理。
 */
export function consumeEventListeners(element: HTMLElement, eventListeners: EventListeners) {
  const listenerDiscriptors = toListenerDiscriptor(eventListeners)
  for (const discriptor of listenerDiscriptors) {
    registerAEventListener(element, discriptor)
  }
}

/**
 * 注册单条已经规范化完成的事件 descriptor。
 * 这里默认认为事件名、callback 和选项都已经确定，
 * 因而只负责三件事：绑定 DOM listener、收集 callback 返回的 cleanup、
 * 并在 owner 销毁时优先执行显式 cleanup，否则执行回收下来的 cleanup 列表。
 */
function registerAEventListener<K extends EventKey>(element: HTMLElement, discriptor: ListenerDiscriptor<K>) {
  const options = {
    once: discriptor.once,
    capture: discriptor.capture,
    passive: discriptor.passive,
  }
  const cleanups: CleanupCallback[] = []
  const listener = (event: Event) => {
    const cleanup = discriptor.callback(event as GlobalEventHandlersEventMap[K])
    if (discriptor.cleanup || !cleanup) {
      return
    }
    cleanups.push(cleanup)
  }

  element.addEventListener(discriptor.event, listener, options)

  onCleanup(() => {
    element.removeEventListener(discriptor.event, listener, options)
    if (discriptor.cleanup) {
      discriptor.cleanup()
      return
    }
    for (const cleanup of cleanups) {
      cleanup()
    }
  })
}
