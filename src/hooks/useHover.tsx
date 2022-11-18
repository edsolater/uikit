import { useEffect } from 'react'

import { getHTMLElementsFromRefs, HTMLElementRefs } from '../utils/react/getElementsFromRefs'
import { useToggle } from './useToggle'

//#region ------------------- hook: useHover() -------------------

export interface UseHoverOptions {
  triggerDelay?: number
  disable?: boolean
  onHoverStart?: (info: { ev: PointerEvent }) => void
  onHoverEnd?: (info: { ev: PointerEvent }) => void
  onHover?: (info: { ev: PointerEvent; is: 'start' | 'end' }) => void
}

export function useHover(
  ref: HTMLElementRefs,
  { disable, onHoverStart: onHoverEnter, onHoverEnd: onHoverLeave, onHover, triggerDelay }: UseHoverOptions = {}
) {
  const [isHover, { on: turnonHover, off: turnoffHover }] = useToggle(false)

  useEffect(() => {
    if (disable) return
    let hoverDelayTimerId
    const hoverStartHandler = (ev: PointerEvent) => {
      if (disable) return
      if (triggerDelay) {
        hoverDelayTimerId = setTimeout(() => {
          hoverDelayTimerId = undefined
          turnonHover()
          onHover?.({ ev, is: 'start' })
          onHoverEnter?.({ ev })
        }, triggerDelay)
      } else {
        turnonHover()
        onHover?.({ is: 'start', ev })
        onHoverEnter?.({ ev })
      }
    }
    const hoverEndHandler = (ev: PointerEvent) => {
      if (disable) return
      turnoffHover()
      onHover?.({ ev, is: 'end' })
      onHoverLeave?.({ ev })
      clearTimeout(hoverDelayTimerId)
      hoverDelayTimerId = undefined
    }
    const els = getHTMLElementsFromRefs(ref)
    els.forEach((el) => el.addEventListener('pointerenter', hoverStartHandler))
    els.forEach((el) => el.addEventListener('pointerleave', hoverEndHandler))
    els.forEach((el) => el.addEventListener('pointercancel', hoverEndHandler))
    return () => {
      els.forEach((el) => el.removeEventListener('pointerenter', hoverStartHandler))
      els.forEach((el) => el.removeEventListener('pointerleave', hoverEndHandler))
      els.forEach((el) => el.removeEventListener('pointercancel', hoverEndHandler))
    }
  }, [disable, onHoverEnter, onHoverLeave, onHover])

  return isHover
}
