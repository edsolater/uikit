/**
 * 这个文件负责把已经归一好的 on 声明注册成真实 DOM listener。
 * 它只处理监听器生命周期、cleanup 时序和 Web API 桥接，不负责声明形状解析。
 */
import { onCleanup } from 'solid-js'
import { toListenerDiscriptorPairs, type EventListeners, type EventListenerDiscriptorPair } from './handleOn'

export type EventKey = keyof GlobalEventHandlersEventMap

export type CleanupCallback = () => void

export type CancelEventListenerOptions = {
  /**
   * cancel() 时要不要跳过 cleanup。
   * cleanup 分两层：
   * - global：监听器生命周期级别，挂载后固定，停止监听时执行。
   * - local：单次事件触发级别，每次 callback 返回的 cleanup 都可能不同。
   *
   * 取值规则：
   * - `true`：global / local 两层都跳过。
   * - `false | undefined`：两层都照常执行。
   * - `'global'`：只跳过注册级 cleanup。
   * - `'local'`：只跳过单次事件级 cleanup。
   */
  avoidCleanup?: boolean | 'local' | 'global'
}

export type EventCallback<K extends EventKey> = (payload: {
  event: GlobalEventHandlersEventMap[K]

  element: HTMLElement

  /** 立刻停止当前监听器；默认会执行解绑清理。 */
  cancel: (options?: CancelEventListenerOptions) => void

  /** 阻止默认行为（只是桥接 Web API）。 */
  preventDefault: () => void
}) => void | CleanupCallback

export interface ListenerDiscriptor<K extends EventKey> {
  /* 触发一次后自动移除，并在解绑时执行 cleanup。 */
  once?: boolean

  /** 监听器存在于 捕获阶段 还是 冒泡阶段  */
  capture?: boolean

  /**
   * 承诺不会 preventDefault()
   * 即浏览器行为是否需要等待JS执行完成；因为JS可能调用ev.preventDefault()来取消浏览器默认行为。
   * 默认值为 true，监听器不会对浏览器造成阻塞。
   */
  passive?: boolean

  /** 阻止事件继续冒泡到祖先，放在这里是为了更声明式。 */
  stopPropagation?: boolean

  callback: EventCallback<K>

  /**
   * 注册级 cleanup。
   * 它在 listener 挂载时就已经固定，停止监听时会执行。
   * 这不替代 callback 返回的 local cleanup；两层 cleanup 会并存。
   */
  cleanup?: () => void
}

/**
 * 把 avoidCleanup 解释成针对某一层 cleanup 的最终布尔判定。
 * 这样 stopListening 和 cancel 后的补跑逻辑都能共享同一套规则。
 */
function shouldAvoidCleanup(
  avoidCleanup: CancelEventListenerOptions['avoidCleanup'],
  cleanupLevel: 'local' | 'global',
) {
  if (avoidCleanup === undefined || avoidCleanup === false) return false
  if (avoidCleanup === true) return true
  return avoidCleanup === cleanupLevel
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
  discriptorPair: EventListenerDiscriptorPair<K>,
) {
  const [eventName, discriptor] = discriptorPair
  // 注册级 cleanup 从监听器创建时就固定下来了，整个 listener 生命周期都指向同一个东西。
  const globalCleanup = discriptor.cleanup

  // DOM 原生 listener options；passive 默认收成 true，避免监听器平白阻塞浏览器默认行为。
  const options = {
    once: discriptor.once,
    capture: discriptor.capture,
    passive: discriptor.passive ?? true,
  }

  // callback 返回的是单次事件的 local cleanup；它每一轮都可能不一样。
  // 这里缓存“上一轮事件留下的 local cleanup”，供下一轮事件前或最终停止监听时执行。
  let pendingLocalCleanup: CleanupCallback | undefined

  // isListening 管“当前是否还挂在 DOM 上”，避免多余的 removeEventListener。
  let isListening = true

  // 每次进入下一轮事件前，先把上一轮留下的 local cleanup 跑掉并清空。
  const runPendingLocalCleanup = () => {
    if (!pendingLocalCleanup) return

    const localCleanup = pendingLocalCleanup
    pendingLocalCleanup = undefined
    localCleanup()
  }

  // 所有“停止监听”的入口都走这里：手动 cancel、once 自动移除、Solid 组件卸载。
  // 停止时会执行注册级 global cleanup，以及最后一轮尚未消费的 local cleanup。
  const stopListening = (stopOptions?: CancelEventListenerOptions) => {
    if (!isListening) return

    // 这里先把“这一层要不要跳过”算成明确布尔值，后面只管按层执行。
    const avoidGlobalCleanup = shouldAvoidCleanup(stopOptions?.avoidCleanup, 'global')
    const avoidLocalCleanup = shouldAvoidCleanup(stopOptions?.avoidCleanup, 'local')

    isListening = false
    element.removeEventListener(eventName, listener, options)

    // boolean 会同时控制两层 cleanup；'local' / 'global' 只控制各自那一层。
    if (!avoidGlobalCleanup) {
      globalCleanup?.()
    }

    if (!avoidLocalCleanup) {
      runPendingLocalCleanup()
    } else {
      pendingLocalCleanup = undefined
    }
  }

  const listener = (event: Event) => {
    // 只记录“当前这一次事件”里是否显式要求跳过 local cleanup，不把这个状态扩散到 listener 生命周期外。
    let avoidCurrentLocalCleanup = false

    // 让声明式的 stopPropagation 落在注册层，而不是要求业务回调每次自己写。
    if (discriptor.stopPropagation) {
      event.stopPropagation()
    }

    // 正常事件语义里，先清掉上一次事件留下的 local cleanup，再进入这一次回调。
    runPendingLocalCleanup()

    // 这里桥接回业务层的只有 4 个东西：原始事件、元素、取消监听、阻止默认行为。
    const localCleanup = discriptor.callback({
      event: event as GlobalEventHandlersEventMap[K],
      element,
      cancel: (stopOptions) => {
        avoidCurrentLocalCleanup = shouldAvoidCleanup(stopOptions?.avoidCleanup, 'local')
        stopListening(stopOptions)
      },
      preventDefault: () => event.preventDefault(),
    })

    // callback 返回的 cleanup 是这一轮事件自己的 local cleanup；它不替代 global cleanup。
    if (localCleanup) {
      if (isListening) {
        // 正常情况：把这次 local cleanup 留给“下一次事件开始前”或者“停止监听时”再跑。
        pendingLocalCleanup = localCleanup
      } else if (!avoidCurrentLocalCleanup) {
        // 特殊情况：回调内部已经 cancel() 了，当前 local cleanup 已经等不到下一次事件，只能立刻补跑。
        localCleanup()
      }
    }

    // once 触发后也走 stopListening，这样 global/local 两层 cleanup 都仍然能被正确处理。
    if (discriptor.once) {
      stopListening()
    }
  }

  element.addEventListener(eventName, listener, options)

  // 组件生命周期结束时，和手动 cancel 一样走同一条解绑路径。
  onCleanup(() => {
    stopListening()
  })
}
