/**
 * 这个文件定义 Piv 的 on 声明协议，并把 descriptor、pair、record 归一成统一事件声明。
 * 它只负责声明形状和复杂 on 输入管理，不负责真实 DOM listener 注册。
 */
import { isArray, isFunction, isString, toArray, type MayArray } from '@edsolater/fnkit'
import type { ListenerDiscriptor, EventCallback, EventKey } from './registerEventListeners'

interface EventListenerDiscriptor<K extends EventKey = EventKey> extends ListenerDiscriptor<K> {
  event: K
}

export type EventListenerInput<K extends EventKey> = MayArray<
  ListenerDiscriptor<K> | EventCallback<K> | undefined
>

/**
 * 【工具函数】
 * 创建一个完整的事件声明对象，方便用户在业务层复用
 * @param event
 * @param callback
 * @param options
 * @returns
 */
export function createEventListenerDiscriptor<K extends EventKey>(
  event: K,
  callback: EventCallback<K>,
  options?: Omit<ListenerDiscriptor<K>, 'callback'>,
): EventListenerDiscriptor<K> {
  return {
    event,
    callback,
    ...options,
  }
}

function isEventListenerDiscriptor<K extends EventKey>(obj: any): obj is EventListenerDiscriptor<K> {
  return obj && isString(obj.event) && isFunction(obj.callback)
}

export type EventListenerPair<K extends EventKey = EventKey> = [event: K, eventDiscriptor: EventListenerInput<K>]

export type EventListenerDiscriptorPair<K extends EventKey = EventKey> = [
  event: K,
  eventDiscriptor: ListenerDiscriptor<K>,
]

// on 入口允许 descriptor、pair 和 map 三种声明形状，进入 DOM 前统一压平成 descriptor。
type ListenerDiscriptorsRecord<K extends EventKey = EventKey> = {
  [EventKey in K]?: EventListenerInput<EventKey>
}

export type EventListenerDeclaration<K extends EventKey = EventKey> =
  | EventListenerDiscriptor<K>
  | EventListenerPair<K>
  | ListenerDiscriptorsRecord<K>
  | undefined

export type EventListeners = MayArray<EventListenerDeclaration>

function isListenerDiscriptorPair(value: any): value is EventListenerPair {
  return value && isArray(value) && value.length === 2 && isString(value[0])
}

function toEventListenersList(eventListeners: EventListeners): NonNullable<EventListenerDeclaration>[] {
  if (!eventListeners) return []
  // 单体输入的情况；要做单独判断
  if (isListenerDiscriptorPair(eventListeners) || isEventListenerDiscriptor(eventListeners)) {
    return [eventListeners]
  } else {
    return toArray(eventListeners)
  }
}

function toBaseListenerDiscriptor<K extends EventKey>(
  discriptorOrCallback: ListenerDiscriptor<K> | EventCallback<K>,
): ListenerDiscriptor<K> {
  if (isFunction(discriptorOrCallback)) {
    return { callback: discriptorOrCallback }
  } else {
    return discriptorOrCallback
  }
}

/**
 * 只做声明形状归一，不触碰 DOM，也不处理 cleanup。
 */
export function toListenerDiscriptorPairs(eventListeners: EventListeners): EventListenerDiscriptorPair[] {
  const eventListenerList = toEventListenersList(eventListeners)
  const eventListenerPairs = eventListenerList.flatMap((eventListener) => {
    if (!eventListener) return []
    if (Array.isArray(eventListener)) {
      const [event, discriptorsOrCallbacks] = eventListener
      return toArray(discriptorsOrCallbacks).map((v) => [event, toBaseListenerDiscriptor(v)]) // 咦？这里怎么没报错？
    } else if (isEventListenerDiscriptor(eventListener)) {
      return [[eventListener.event, eventListener]]
    } else {
      const purePairs: EventListenerDiscriptorPair[] = []
      for (const [event, discriptorsOrCallbacks] of Object.entries(eventListener) as EventListenerPair[]) {
        const pairs: EventListenerDiscriptorPair[] = []
        for (const discriptorOrCallback of toArray(discriptorsOrCallbacks)) {
          if (!discriptorOrCallback) continue
          pairs.push([event, toBaseListenerDiscriptor(discriptorOrCallback)])
        }
        purePairs.push(...pairs)
      }
      return purePairs
    }
  }) as EventListenerDiscriptorPair[]
  return eventListenerPairs
}
