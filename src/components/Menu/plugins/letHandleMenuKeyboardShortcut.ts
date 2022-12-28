import { useEffect, useRef } from 'react'
import { MenuController, MenuCoreProps } from '..'
import { handleKeyboardShortcut } from '../../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../../../plugins'

export type LetHandleMenuKeyboardShortcut = {}

export const letHandleMenuKeyboardShortcut = createPlugin<MenuCoreProps<unknown>>(() => {
  const divRef = useRef<HTMLElement>()
  const menuController = useRef<MenuController<unknown>>()
  useEffect(() => {
    if (!divRef.current) return
    // TODO make handleKeyboardShortcut use getHTMLElementsFromRefs to get Elements
    const subscription = handleKeyboardShortcut(divRef.current, {
      'ArrowRight': menuController.current?.toNext,
      'ArrowLeft': menuController.current?.toPrev,
      'ctrl + ArrowLeft': menuController.current?.toFirst,
      'Home': menuController.current?.toFirst,
      'ctrl + ArrowRight': menuController.current?.toLast,
      'End': menuController.current?.toLast
    })
    return subscription.abort
  }, [])
  return { domRef: divRef, controller: menuController }
})
