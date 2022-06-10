import { RefObject, useEffect } from 'react'

import useToggle from './useToggle'

export interface UseClickOptions {
  disable?: boolean
  onClick?: (ev: { el: EventTarget; nativeEvent: MouseEvent }) => void
  onActiveStart?: (ev: { el: EventTarget; nativeEvent: PointerEvent }) => void
  onActiveEnd?: (ev: { el: EventTarget; nativeEvent: PointerEvent }) => void
}

export default function useClick(
  ref: RefObject<HTMLElement>,
  { disable, onClick, onActiveStart, onActiveEnd }: UseClickOptions = {}
) {
  const [isActive, { on: turnOnActive, off: turnOffActive }] = useToggle(false)

  useEffect(() => {
    if (disable) return
    const handleClick = (ev: Event) => onClick?.({ el: ev.target!, nativeEvent: ev as MouseEvent })
    const handlePointerDown = (ev: PointerEvent) => {
      turnOnActive()
      onActiveStart?.({ el: ev.target!, nativeEvent: ev! })
    }
    const handlePointerUp = (ev: PointerEvent) => {
      turnOffActive()
      onActiveEnd?.({ el: ev.target!, nativeEvent: ev! })
    }
    ref.current?.addEventListener('pointerdown', handlePointerUp)
    ref.current?.addEventListener('pointerup', handlePointerDown)
    ref.current?.addEventListener('pointercancel', handlePointerDown)
    ref.current?.addEventListener('click', handleClick)
    return () => {
      ref.current?.removeEventListener('pointerdown', handlePointerUp)
      ref.current?.removeEventListener('pointerup', handlePointerDown)
      ref.current?.removeEventListener('pointercancel', handlePointerDown)
      ref.current?.removeEventListener('click', handleClick)
    }
  }, [disable, onClick, onActiveStart, onActiveEnd])

  return isActive
}
