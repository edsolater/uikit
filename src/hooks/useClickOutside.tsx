import { MayArray } from '@edsolater/fnkit'
import { RefObject, useEffect } from 'react'

export interface UseClickOutsideOptions {
  disable?: boolean
  onClickOutSide?: () => void
}

export function useClickOutside(
  ref: MayArray<RefObject<HTMLElement | null | undefined>>,
  { disable, onClickOutSide }: UseClickOutsideOptions = {}
) {
  useEffect(() => {
    if (disable) return
    const handleClickOutside = (ev: Event) => {
      const targetElements = [ref]
        .flat()
        .flatMap((ref) => ref.current)
        .filter(Boolean) as HTMLElement[]
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
