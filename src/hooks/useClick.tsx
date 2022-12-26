import { RefObject, useEffect } from 'react'
import { handleClick, HandleClickOptions } from '../utils/dom/gesture/handleClick'
import { getElementsFromRefs } from '../utils/react/getElementsFromRefs'
import { useToggle } from './useToggle'

export function useClick(ref: RefObject<HTMLElement | undefined | null>, options?: HandleClickOptions) {
  const [isActive, { on: turnOnActive, off: turnOffActive }] = useToggle(false)

  useEffect(() => {
    const controls = handleClick(getElementsFromRefs(ref), options)
    controls.onStateChange((isActive) => (isActive ? turnOnActive() : turnOffActive()))
    return controls.cancel
  }, [ref, ...Object.values(options ?? {})])

  return isActive
}
