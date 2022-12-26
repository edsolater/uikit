import { useEffect } from 'react'
import { handleHover, HandleHoverOptions } from '../utils/dom/gesture/handleHover'
import { getElementsFromRefs } from '../utils/react/getElementsFromRefs'
import { ElementRefs } from '../utils/react/getElementsFromRefs'
import { useToggle } from './useToggle'

export function useHover(ref: ElementRefs, options?: HandleHoverOptions) {
  const [isHover, { on: turnonHover, off: turnoffHover }] = useToggle(false)

  useEffect(() => {
    const controls = handleHover(getElementsFromRefs(ref), options)
    controls.onStateChange((ishover) => (ishover ? turnonHover() : turnoffHover()))
    return controls.cancel
  }, [ref, ...Object.values(options ?? {})])

  return isHover
}
