import { HTMLElements } from '../getHTMLElementsFromEls'
import { getElementsFromRefs } from '../../react/getElementsFromRefs'
import { createObserveValue } from '../../fnkit/createObserveValue';

export interface HandleClickOptions {
  disable?: boolean
  onClick?: (info: { ev: PointerEvent; finalEv?: MouseEvent; pressDuration: number }) => void
  onActiveStart?: (info: { ev: PointerEvent }) => void
  onActiveEnd?: (info: { ev: PointerEvent; pressDuration: number }) => void

  /** handle pointer Long press */
  longClickFireEach?: number

  /** handle pointer Long press  */
  longClickDelay?: number

  /** if set, onClick can fire multi time */
  canLongClick?: boolean
}

export function handleClick(
  targets: HTMLElements,
  {
    disable,
    onClick,
    onActiveStart,
    onActiveEnd,
    longClickDelay = 600,
    longClickFireEach = 80,
    canLongClick
  }: HandleClickOptions = {}
) {
  const isActive = createObserveValue(false)

  let startPointEvent: PointerEvent | undefined = undefined

  // record duration to handle long press
  let pressDownAt = 0 // timestamp
  let pressUpAt = 0 // timestamp

  // start callbacks
  const handleClick = (ev: MouseEvent) =>
    onClick?.(
      startPointEvent
        ? { ev: startPointEvent, finalEv: ev, pressDuration: pressUpAt - pressDownAt }
        : { ev: ev as unknown as PointerEvent, pressDuration: pressUpAt - pressDownAt }
    )

  const handlePointerDown = (ev: PointerEvent) => {
    isActive.set(true)
    pressDownAt = globalThis.performance.now()
    startPointEvent = ev
    onActiveStart?.({ ev })
  }
  const handlePointerUp = (ev: PointerEvent) => {
    isActive.set(false)
    pressUpAt = globalThis.performance.now()
    onActiveEnd?.({ ev, pressDuration: pressUpAt - pressDownAt })
  }

  // handle long press
  const handleLongClick = (isActive: boolean) => {
    if (isActive && canLongClick) {
      const startTimestamp = Date.now()
      let startCalcLongPressTimestamp: number
      const timeId = setInterval(() => {
        const endTimestamp = Date.now()
        if (!startCalcLongPressTimestamp && endTimestamp - startTimestamp >= longClickDelay) {
          startCalcLongPressTimestamp = endTimestamp
        }
        if (startCalcLongPressTimestamp && endTimestamp - startCalcLongPressTimestamp >= longClickFireEach) {
          startPointEvent && onClick?.({ ev: startPointEvent, pressDuration: endTimestamp - startTimestamp })
          startCalcLongPressTimestamp = endTimestamp
        }
      }, longClickFireEach)
      return () => clearInterval(timeId)
    }
  }

  isActive.onChange((active) => handleLongClick(active))

  const attachListener = () => {
    const els = getElementsFromRefs(targets)
    els.forEach((el) => el.addEventListener('pointerdown', handlePointerDown))
    els.forEach((el) => el.addEventListener('pointerup', handlePointerUp))
    els.forEach((el) => el.addEventListener('pointercancel', handlePointerUp))
    els.forEach((el) => el.addEventListener('click', handleClick))
  }
  attachListener()

  const cancelListener = () => {
    const els = getElementsFromRefs(targets)
    els.forEach((el) => el.removeEventListener('pointerdown', handlePointerDown))
    els.forEach((el) => el.removeEventListener('pointerup', handlePointerUp))
    els.forEach((el) => el.removeEventListener('pointercancel', handlePointerUp))
    els.forEach((el) => el.removeEventListener('click', handleClick))
  }

  return {
    get isActive() {
      return isActive()
    },
    cancel: cancelListener,
    onStateChange: isActive.onChange
  }
}
