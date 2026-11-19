/** 观测 Popover 正文自身的 CSS 过渡，按一次打开或关闭交付过程通知。 */
import { EventEmitter } from '@edsolater/fnkit'
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

/** getAnimations 默认仅返回元素自身的动画；按实例排除普通动画及切换前已有的过渡。 */
function hostTransitions(element: HTMLElement) {
  return element
    .getAnimations()
    .filter(
      (animation): animation is CSSTransition =>
        animation instanceof CSSTransition,
    )
}

/** 观察一次实际提交的切换；Start 后只允许完成或取消一次。 */
function observeTransition(
  element: HTMLElement,
  open: boolean,
  transitions: CSSTransition[],
  options: PopoverBodyOptions,
  release: () => void,
) {
  const listeners = new EventEmitter<{
    end: [PopoverTransitionContext]
    cancel: [PopoverTransitionContext]
  }>()
  let started = false
  let settled = false
  const context: PopoverTransitionContext = {
    transaction: {
      direction: open ? 'open' : 'close',
      onEnd(listener) {
        if (!settled) listeners.on('end', listener)
      },
      onCancel(listener) {
        if (!settled) listeners.on('cancel', listener)
      },
    },
  }

  function start() {
    if (started || settled) return
    started = true
    if (open) options.onOpenStart?.(context)
    else options.onCloseStart?.(context)
  }

  function finish(reason: 'end' | 'cancel') {
    if (settled) return
    settled = true
    element.removeEventListener('transitionstart', onTransitionStart)
    release()
    if (!started) return
    try {
      if (reason === 'cancel') options.onCancel?.(context)
      else if (open) options.onOpenEnd?.(context)
      else options.onCloseEnd?.(context)
      listeners.emit(reason, [context])
    } finally {
      listeners.removeAllListeners()
    }
  }

  function hasStarted(animation: CSSTransition) {
    const timing = animation.effect?.getComputedTiming()
    return (
      timing &&
      typeof timing.localTime === 'number' &&
      timing.localTime >= Number(timing.delay)
    )
  }

  function onTransitionStart(event: TransitionEvent) {
    if (
      event.target === element &&
      !event.pseudoElement &&
      transitions.some(
        animation =>
          animation.transitionProperty === event.propertyName &&
          hasStarted(animation),
      )
    )
      start()
  }

  function complete() {
    if (element.matches(':popover-open') !== open) return finish('cancel')
    start()
    finish(element.matches(':popover-open') === open ? 'end' : 'cancel')
  }

  return {
    cancel: () => finish('cancel'),
    observe() {
      if (transitions.length === 0) {
        complete()
        return
      }
      element.addEventListener('transitionstart', onTransitionStart)
      Promise.all(transitions.map(animation => animation.finished)).then(
        complete,
        () => finish('cancel'),
      )
      // 原生 toggle 可能晚于活动开始；正延迟尚未走完时等待 transitionstart。
      if (transitions.some(hasStarted)) start()
    },
  }
}

/** 在 Before 记录原过渡，在实际 toggle 确认显隐后接管本次新增的过渡。 */
export function createPopoverTransitionObserver(options: PopoverBodyOptions) {
  let before: { open: boolean; previous: Set<CSSTransition> } | undefined
  let current: ReturnType<typeof observeTransition> | undefined
  let disposed = false
  return {
    prepare(element: HTMLElement, open: boolean) {
      if (
        !disposed &&
        (options.onOpenStart ||
          options.onCloseStart ||
          options.onOpenEnd ||
          options.onCloseEnd ||
          options.onCancel)
      ) {
        before = { open, previous: new Set(hostTransitions(element)) }
      }
    },
    confirm(element: HTMLElement) {
      const request = before
      before = undefined
      if (!request || element.matches(':popover-open') !== request.open) return
      const transitions = hostTransitions(element).filter(
        animation => !request.previous.has(animation),
      )
      current?.cancel()
      if (
        disposed ||
        before ||
        element.matches(':popover-open') !== request.open
      )
        return
      current = observeTransition(
        element,
        request.open,
        transitions,
        options,
        () => {
          current = undefined
        },
      )
      current.observe()
    },
    dispose() {
      disposed = true
      before = undefined
      current?.cancel()
      current = undefined
    },
  }
}
