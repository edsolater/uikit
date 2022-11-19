import { RefObject, useEffect, useRef } from 'react'

import { addTabIndex } from '../utils/dom/addTabIndex'
import { useClick, UseClickOptions } from './useClick'
import { useHover } from './useHover'
import { HandleHoverOptions } from "../functions/dom/gesture/hover"

/**
 *  a merge of {@link useClick} and {@link useHover}, and some tailwindcss class
 */
export function useClickableElement(ref: RefObject<HTMLElement>, options?: UseClickOptions & HandleHoverOptions) {
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
  options?: UseClickOptions & HandleHoverOptions
) {
  const ref = useRef<RefType>(null)
  useClickableElement(ref, options)
  return ref
}
