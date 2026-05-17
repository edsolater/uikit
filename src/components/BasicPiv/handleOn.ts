/**
 * 这个文件消费 Piv 的 on 声明，并把它们注册成真实 DOM listener。
 * 事件声明在 Piv 生命周期内是静态入口；业务状态变化不通过替换 listener 表达。
 */
import { toArray, type MayArray, isArray, isString, isFunction } from '@edsolater/fnkit'
import { onCleanup } from 'solid-js'
import { isFunctionDeclaration } from 'typescript'

type EventKey = keyof GlobalEventHandlersEventMap

type CleanupCallback = () => void

type EventCallback<K extends EventKey> = (payload: {
  event: GlobalEventHandlersEventMap[K]

  element: HTMLElement

  /** TODO：立刻停止监听器 */
  cancel: (payloads: {
    /** TODO：默认会导致cleanup执行，但有也可以取消此行为 */

    avoidCleanup: (whether: boolean) => void
  }) => void

  /** TODO：阻止默认行为（只是桥接web API） */
  preventDefault: () => void
}) => void | CleanupCallback

interface BaseEventListenerDiscriptor<K extends EventKey> {
  /* 触发一次后自动移除，
   TODO：待实现：执行 cleanup清理函数 */
  once?: boolean

  /** 监听器存在于 捕获阶段 还是 冒泡阶段  */
  capture?: boolean

  /**
   * 承诺不会 preventDefault()
   * 即浏览器行为是否需要等待JS执行完成；因为JS可能调用ev.preventDefault()来取消浏览器默认行为。
   * TODO：默认值为true，监听器不会对浏览器造成阻塞
   */
  passive?: boolean

  /** TODO：阻止冒泡到祖先，（放在这里是为了更声明式） */
  stopPropagation?: boolean

  callback: EventCallback<K>

  // 如果指定了 cleanup，则忽略 callback 返回的 cleanup，改为在事件解绑时调用这个 cleanup。
  cleanup?: () => void
}

interface EventListenerDiscriptor<K extends EventKey = EventKey> extends BaseEventListenerDiscriptor<K> {
  event: K
}

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
  options?: Omit<BaseEventListenerDiscriptor<K>, 'callback'>,
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

type ListenerDiscriptorPair<K extends EventKey = EventKey> = [
  event: K,
  eventDiscriptor: MayArray<BaseEventListenerDiscriptor<K> | EventCallback<K> | undefined>,
]

type PureBaseListenerDiscriptorPair<K extends EventKey = EventKey> = [
  event: K,
  eventDiscriptor: BaseEventListenerDiscriptor<K>,
]

// on 入口允许 descriptor、pair 和 map 三种声明形状，进入 DOM 前统一压平成 descriptor。
type ListenerDiscriptorsRecord<K extends EventKey = EventKey> = {
  [EventKey in K]?: MayArray<BaseEventListenerDiscriptor<EventKey> | EventCallback<EventKey> | undefined>
}

export type EventListeners = MayArray<
  EventListenerDiscriptor | ListenerDiscriptorPair | ListenerDiscriptorsRecord | undefined
>

function isListenerDiscriptorPair(value: any): value is ListenerDiscriptorPair {
  return value && isArray(value) && value.length === 2 && isString(value[0])
}

function toEventListenersList(
  eventListeners: EventListeners,
): (EventListenerDiscriptor | ListenerDiscriptorPair | ListenerDiscriptorsRecord)[] {
  if (!eventListeners) return []
  // 单体输入的情况；要做单独判断
  if (isListenerDiscriptorPair(eventListeners) || isEventListenerDiscriptor(eventListeners)) {
    return [eventListeners]
  } else {
    return toArray(eventListeners)
  }
}

function toBaseListenerDiscriptor<K extends EventKey>(
  discriptorOrCallback: BaseEventListenerDiscriptor<K> | EventCallback<K>,
): BaseEventListenerDiscriptor<K> {
  if (isFunction(discriptorOrCallback)) {
    return { callback: discriptorOrCallback }
  } else {
    return discriptorOrCallback
  }
}
/**
 * 只做声明形状归一，不触碰 DOM，也不处理 cleanup。
 */
function toListenerDiscriptorPairs(eventListeners: EventListeners): PureBaseListenerDiscriptorPair[] {
  const eventListenerList = toEventListenersList(eventListeners)
  const eventListenerPairs = eventListenerList.flatMap((eventListener) => {
    if (!eventListener) return []
    if (Array.isArray(eventListener)) {
      const [event, discriptorsOrCallbacks] = eventListener
      return toArray(discriptorsOrCallbacks).map((v) => [event, toBaseListenerDiscriptor(v)]) // 咦？这里怎么没报错？
    } else if (isEventListenerDiscriptor(eventListener)) {
      return [[eventListener.event, eventListener]]
    } else {
      const purePairs: PureBaseListenerDiscriptorPair[] = []
      for (const [event, discriptorsOrCallbacks] of Object.entries(eventListener) as ListenerDiscriptorPair[]) {
        const pairs: PureBaseListenerDiscriptorPair[] = []
        for (const discriptorOrCallback of toArray(discriptorsOrCallbacks)) {
          if (!discriptorOrCallback) continue
          pairs.push([event, toBaseListenerDiscriptor(discriptorOrCallback)])
        }
        purePairs.push(...pairs)
      }
      return purePairs
    }
  }) as PureBaseListenerDiscriptorPair[]
  return eventListenerPairs
}

/**
 * 消费完整 on 声明，并逐条注册到目标 DOM。
 */
export function consumeEventListeners(element: HTMLElement, eventListeners: EventListeners) {
  const discriptorPairs = toListenerDiscriptorPairs(eventListeners)
  for (const discriptor of discriptorPairs) {
    registerAEventListener(element, discriptor)
  }
}

/**
 * 单条 listener 的注册和回收边界。
 * 显式 cleanup 优先于 callback 返回的 cleanup，避免同一事件来源出现两套清理语义。
 */
function registerAEventListener<K extends EventKey>(
  element: HTMLElement,
  discriptorPair: PureBaseListenerDiscriptorPair<K>,
) {
  const [eventName, discriptor] = discriptorPair
  const options = {
    once: discriptor.once,
    capture: discriptor.capture,
    passive: discriptor.passive,
  }
  const cleanups: CleanupCallback[] = []
  const listener = (event: Event) => {
    const cleanup = discriptor.callback({
      event: event as GlobalEventHandlersEventMap[K],
      element,
      cancel: () => element.removeEventListener(eventName, listener, options),
    })
    // 需要处理特殊情况，就是有option:once的时候
    if (discriptor.cleanup || !cleanup) {
      return
    }
    cleanups.push(cleanup)
  }

  element.addEventListener(eventName, listener, options)

  onCleanup(() => {
    element.removeEventListener(eventName, listener, options)
    if (discriptor.cleanup) {
      discriptor.cleanup()
      return
    }
    for (const cleanup of cleanups) {
      cleanup()
    }
  })
}
