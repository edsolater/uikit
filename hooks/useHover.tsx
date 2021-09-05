import useToggle from './useToggle'
import { RefObject, useEffect } from 'react'

//#region ------------------- hook: useHover() -------------------

export interface UseHoverOptions {
  disable?: boolean
  onHoverStart?: (ev: { el: EventTarget; nativeEvent: PointerEvent }) => void
  onHoverEnd?: (ev: { el: EventTarget; nativeEvent: PointerEvent }) => void
  onHover?: (ev: { el: EventTarget; nativeEvent: PointerEvent; now: 'start' | 'end' }) => void
}

export function useHover(
  ref: RefObject<HTMLElement>,
  { disable, onHoverStart, onHoverEnd, onHover }: UseHoverOptions = {}
) {
  const [isHover, { on: turnonHover, off: turnoffHover }] = useToggle(false)

  useEffect(() => {
    if (disable) return
    const hoverStartHandler = (ev: PointerEvent) => {
      turnonHover()
      onHover?.({
        el: ev.target!,
        nativeEvent: ev!,
        now: 'start'
      })
      onHoverStart?.({
        el: ev.target!,
        nativeEvent: ev!
      })
    }
    const hoverEndHandler = (ev: PointerEvent) => {
      turnoffHover()
      onHover?.({
        el: ev.target!,
        nativeEvent: ev!,
        now: 'end'
      })
      onHoverEnd?.({
        el: ev.target!,
        nativeEvent: ev!
      })
    }
    ref.current?.addEventListener('pointerenter', hoverStartHandler)
    ref.current?.addEventListener('pointerleave', hoverEndHandler)
    ref.current?.addEventListener('pointercancel', hoverEndHandler)
    return () => {
      ref.current?.removeEventListener('pointerleave', hoverEndHandler)
      ref.current?.removeEventListener('pointercancel', hoverEndHandler)
      ref.current?.removeEventListener('pointerenter', hoverStartHandler)
    }
  }, [disable, onHoverStart, onHoverEnd, onHover])

  return isHover
}
