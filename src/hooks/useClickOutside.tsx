import { useEffect } from 'react'
import { getHTMLElementsFromRefs, HTMLElementRefs } from '../utils/react/getElementsFromRefs'

export interface UseClickOutsideOptions {
  disable?: boolean
  onClickOutSide?: () => void
}

export function useClickOutside(
  ref: HTMLElementRefs,
  { disable, onClickOutSide }: UseClickOutsideOptions = {}
) {
  useEffect(() => {
    if (disable) return
    const handleClickOutside = (ev: Event) => {
      const targetElements = getHTMLElementsFromRefs(ref)
      if (!targetElements.length) return
      const path = ev.composedPath()
      if (targetElements.some((el) => el && path.includes(el))) return
      onClickOutSide?.()
    }
    window.document?.addEventListener('click', handleClickOutside, { capture: true })
    return () => {
      window.document?.removeEventListener('click', handleClickOutside, { capture: true })
    }
  }, [ref, disable, onClickOutSide])
}
