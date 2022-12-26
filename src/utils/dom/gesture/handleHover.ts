import { HTMLElements } from '../getHTMLElementsFromEls'
import { getElementsFromRefs } from '../../react/getElementsFromRefs'
import { createObserveValue } from '../../fnkit/createObserveValue'

export interface HandleHoverOptions {
  triggerDelay?: number
  disable?: boolean
  onHoverEnter?: (info: { ev: PointerEvent }) => void
  onHoverLeave?: (info: { ev: PointerEvent }) => void
  onHover?: (info: { ev: PointerEvent; is: 'start' | 'end' }) => void
}

export function handleHover(
  targets: HTMLElements,
  options?: HandleHoverOptions
): {
  readonly isHover: boolean
  cancel: () => void
  onStateChange: (cb: (newValue: boolean, prevValue: boolean) => any) => void
} {
  const isHover = createObserveValue(false)
  let hoverDelayTimerId: any

  const hoverStartHandler = (ev: PointerEvent) => {
    if (options?.disable) return
    if (options?.triggerDelay) {
      hoverDelayTimerId = setTimeout(() => {
        hoverDelayTimerId = undefined
        isHover.set(true)
        options?.onHover?.({ ev, is: 'start' })
        options?.onHoverEnter?.({ ev })
      }, options?.triggerDelay)
    } else {
      isHover.set(true)
      options?.onHover?.({ is: 'start', ev })
      options?.onHoverEnter?.({ ev })
    }
  }

  const hoverEndHandler = (ev: PointerEvent) => {
    isHover.set(false)
    options?.onHover?.({ ev, is: 'end' })
    options?.onHoverLeave?.({ ev })
    clearTimeout(hoverDelayTimerId)
    hoverDelayTimerId = undefined
  }

  const attachListener = () => {
    const els = getElementsFromRefs(targets)
    els.forEach((el) => el.addEventListener('pointerenter', hoverStartHandler))
    els.forEach((el) => el.addEventListener('pointerleave', hoverEndHandler))
    els.forEach((el) => el.addEventListener('pointercancel', hoverEndHandler))
  }

  const cancelListener = () => {
    const els = getElementsFromRefs(targets)
    els.forEach((el) => el.removeEventListener('pointerenter', hoverStartHandler))
    els.forEach((el) => el.removeEventListener('pointerleave', hoverEndHandler))
    els.forEach((el) => el.removeEventListener('pointercancel', hoverEndHandler))
  }

  attachListener()

  return {
    get isHover() {
      return isHover()
    },
    cancel: cancelListener,
    onStateChange: isHover.onChange
  }
}
