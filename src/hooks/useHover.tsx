import { useEffect } from 'react'
import { getElementsFromRefs } from '../functions/getElementsFromRefs'

import { HTMLElementRefs } from '../utils/react/getElementsFromRefs'
import { useToggle } from './useToggle'
import { HandleHoverOptions, handleHover } from '../functions/dom/gesture/hover'

//#region ------------------- hook: useHover() -------------------

export function useHover(ref: HTMLElementRefs, options?: HandleHoverOptions) {
  const [isHover, { on: turnonHover, off: turnoffHover }] = useToggle(false)
  useEffect(() => {
    if (!options) return
    const controls = handleHover(getElementsFromRefs(ref), options)
    controls.onStateChange((ishover) => (ishover ? turnonHover() : turnoffHover()))
    return controls.cancel
  }, [options?.disable, options?.onHoverEnter, options?.onHoverLeave, options?.onHover])
  return isHover
}
