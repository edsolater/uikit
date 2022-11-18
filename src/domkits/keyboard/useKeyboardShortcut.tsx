import { useCallback, useEffect, useRef } from 'react'
import { createRefHook } from '../../functions'
import { EventListenerController } from '../../utils/dom/addEventListener'
import { getHTMLElementsFromRefs, HTMLElementRefs } from '../../utils/react/getElementsFromRefs'
import {
  AuxiliaryKeyName,
  bindKeyboardShortcut,
  ContentKeyName,
  preventDefaultKeyboardShortcut
} from './handleShortcut'

export function uniqueItems<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * case insensitive(if u want to bind uppercase 'A' , attach 'shift + a' )
 *
 * it is not so good to customize the `Tab`, `Tab` should be move focus
 */
export function useKeyboardShortcut(
  el: HTMLElementRefs,
  keyboardShortcutSetting: {
    [key in `${`${AuxiliaryKeyName | Capitalize<AuxiliaryKeyName>} + ` | ''}${ContentKeyName}`]?: () => void
  },
  options?: {
    /** this still not prevent **all** brower shortcut (like build-in ctrl T ) */
    preventAllBrowserKeyboardShortcut?: boolean
  }
): { abortKeyboard: () => void } {
  const bindControllers = useRef<EventListenerController[]>([])

  // prevent browser default keyboard shortcut (should avoid browser build-in shortcut as much as possiable)
  useEffect(() => {
    if (!options?.preventAllBrowserKeyboardShortcut) return
    const pureEls = getHTMLElementsFromRefs(el)
    pureEls.forEach((pureEl) => preventDefaultKeyboardShortcut(pureEl))
  }, [])

  useEffect(() => {
    const pureEls = getHTMLElementsFromRefs(el)
    const controllers = pureEls.map((pureEl) => bindKeyboardShortcut(pureEl, keyboardShortcutSetting))
    bindControllers.current = controllers
    return () => bindControllers.current.forEach((control) => control.cancel())
  }, [el])
  const abortKeyboard = useCallback(() => bindControllers.current.forEach((control) => control.cancel()), [])
  return { abortKeyboard }
}


export const useKeyboardShortcutRef = createRefHook(useKeyboardShortcut)