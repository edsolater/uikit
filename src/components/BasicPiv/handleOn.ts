/**
 * 这个文件消费 Piv 的 on 声明，并把它们注册成真实 DOM listener。
 * 事件声明在 Piv 生命周期内是静态入口；业务状态变化不通过替换 listener 表达。
 */
import { toArray, type MayArray } from '@edsolater/fnkit'
import { onCleanup } from 'solid-js'
import type { PropValueWrapper } from './type'

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

// on 入口允许 descriptor、pair 和 map 三种声明形状，进入 DOM 前统一压平成 descriptor。
type EventListener<K extends EventKey = EventKey> =
  | ListenerDiscriptor<K>
  | ListenerDiscriptPair<K>
  | ListenerDiscriptMap<K>

export type EventListeners<K extends EventKey = EventKey> = PropValueWrapper<EventListener<K>>

/**
 * 只做声明形状归一，不触碰 DOM，也不处理 cleanup。
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
 * 消费完整 on 声明，并逐条注册到目标 DOM。
 */
export function consumeEventListeners(element: HTMLElement, eventListeners: EventListeners) {
  const listenerDiscriptors = toListenerDiscriptor(eventListeners)
  for (const discriptor of listenerDiscriptors) {
    registerAEventListener(element, discriptor)
  }
}

/**
 * 单条 listener 的注册和回收边界。
 * 显式 cleanup 优先于 callback 返回的 cleanup，避免同一事件来源出现两套清理语义。
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
