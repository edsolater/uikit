import { RefObject, useEffect, useRef } from 'react'

import { HandleClickOptions } from '../utils/dom/gesture/handleClick'
import { HandleHoverOptions } from '../utils/dom/gesture/handleHover'
import { addTabIndex } from '../utils/dom/addTabIndex'
import { useClick } from './useClick'
import { useHover } from './useHover'

/**
 *  a merge of {@link useClick} and {@link useHover}, and some tailwindcss class
 */
export function useClickableElement(ref: RefObject<HTMLElement>, options?: HandleClickOptions & HandleHoverOptions) {
  useClick(ref, options)
  useHover(ref, options)
  useEffect(() => {
    if (options?.disable) return
    ref.current?.classList.add(
      'cursor-pointer',
      'select-none',
      'active:brightness-75',
      'hover:brightness-90',
      'filter',
      'transition',
      'duration-75'
    )
    addTabIndex(ref.current)
  }, [options])
}

export function useClickableElementRef<RefType extends HTMLElement = HTMLElement>(
  options?: HandleClickOptions & HandleHoverOptions
) {
  const ref = useRef<RefType>(null)
  useClickableElement(ref, options)
  return ref
}
