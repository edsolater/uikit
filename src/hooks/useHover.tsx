import { useEffect } from 'react'
import { handleHover, HandleHoverOptions } from '../functions/dom/gesture/hover'
import { getElementsFromRefs } from '../functions/getElementsFromRefs'
import { HTMLElementRefs } from '../utils/react/getElementsFromRefs'
import { useToggle } from './useToggle'

export function useHover(ref: HTMLElementRefs, options?: HandleHoverOptions) {
  const [isHover, { on: turnonHover, off: turnoffHover }] = useToggle(false)

  useEffect(() => {
    const controls = handleHover(getElementsFromRefs(ref), options)
    controls.onStateChange((ishover) => (ishover ? turnonHover() : turnoffHover()))
    return controls.cancel
  }, [ref, ...Object.values(options ?? {})])

  return isHover
}