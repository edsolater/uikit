/** 确认原生显隐后，跟随 Popover 默认淡入或退层的实际完成信号。 */
import type { PopoverBodyOptions } from './popover'

export interface PopoverTransition {
  readonly direction: 'open' | 'close'
  /** 监听本次过渡完成，仅在过程存活期间登记。 */
  onEnd(listener: PopoverTransitionListener): void
  /** 监听本次过渡取消，仅在过程存活期间登记。 */
  onCancel(listener: PopoverTransitionListener): void
}

export interface PopoverTransitionContext {
  readonly transaction: PopoverTransition
}

export type PopoverTransitionListener = (
  context: PopoverTransitionContext,
) => void

/** 打开跟随淡入，关闭优先等到浏览器释放顶层；没有过渡时即时完成。 */
function findPopoverTransition(element: HTMLElement, open: boolean) {
  const transitions = element
    .getAnimations()
    .filter(
      (animation): animation is CSSTransition =>
        animation instanceof CSSTransition,
    )
  return (
    (!open
      ? transitions.find(
          animation => animation.transitionProperty === 'overlay',
        )
      : undefined) ??
    transitions.find(animation => animation.transitionProperty === 'opacity')
  )
}

/** 当前段独立持有完成与取消订阅，反向淡入淡出由浏览器接续。 */
function createTransition(
  element: HTMLElement,
  open: boolean,
  options: PopoverBodyOptions,
  release: () => void,
) {
  let settled = false
  const listeners: Record<'end' | 'cancel', PopoverTransitionListener[]> = {
    end: [],
    cancel: [],
  }
  const context: PopoverTransitionContext = {
    transaction: {
      direction: open ? 'open' : 'close',
      onEnd(listener) {
        if (!settled) listeners.end.push(listener)
      },
      onCancel(listener) {
        if (!settled) listeners.cancel.push(listener)
      },
    },
  }

  function notify(listener?: PopoverTransitionListener) {
    try {
      listener?.(context)
    } catch (error) {
      globalThis.reportError(error)
    }
  }

  function finish(reason: 'cancel' | 'end') {
    if (settled) return
    settled = true
    release()
    const subscribers = listeners[reason]
    listeners.end = []
    listeners.cancel = []
    notify(
      reason === 'cancel'
        ? options.onCancel
        : open
          ? options.onOpenEnd
          : options.onCloseEnd,
    )
    for (const listener of subscribers) notify(listener)
  }

  function complete() {
    finish(element.matches(':popover-open') === open ? 'end' : 'cancel')
  }

  return {
    cancel: () => finish('cancel'),
    start() {
      const transition = findPopoverTransition(element, open)
      transition?.finished.then(complete, () => finish('cancel'))
      notify(open ? options.onOpenStart : options.onCloseStart)
      if (!transition) complete()
    },
  }
}

/** 下一次 Before 和原生 toggle 都可以证实上次请求已实际切换。 */
export function createPopoverTransitions(options: PopoverBodyOptions) {
  let pendingOpen: boolean | undefined
  let current: ReturnType<typeof createTransition> | undefined
  let disposed = false
  return {
    requestToggle(open: boolean) {
      if (
        current ||
        options.onOpenStart ||
        options.onOpenEnd ||
        options.onCloseStart ||
        options.onCloseEnd ||
        options.onCancel
      ) {
        pendingOpen = open
      }
    },
    confirmToggle(element: HTMLElement) {
      const open = pendingOpen
      pendingOpen = undefined
      if (open === undefined || element.matches(':popover-open') !== open)
        return
      current?.cancel()
      if (
        disposed ||
        pendingOpen !== undefined ||
        element.matches(':popover-open') !== open
      )
        return
      current = createTransition(element, open, options, () => {
        current = undefined
      })
      current.start()
    },
    dispose() {
      disposed = true
      pendingOpen = undefined
      current?.cancel()
    },
  }
}
