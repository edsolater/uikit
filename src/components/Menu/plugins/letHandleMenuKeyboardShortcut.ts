import { useEffect, useRef } from 'react'
import { MenuController, MenuProps } from '..'
import { handleKeyboardShortcut } from '../../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../../../plugins'

export type LetHandleMenuKeyboardShortcut = {}

export const letHandleMenuKeyboardShortcut = createPlugin<MenuProps<unknown>>(() => {
  const divRef = useRef<HTMLElement>()
  const menuController = useRef<MenuController<unknown>>()
  useEffect(() => {
    if (!divRef.current) return
    const subscription = handleKeyboardShortcut(divRef.current, {
      'ArrowDown': menuController.current?.toNext,
      'ArrowUp': menuController.current?.toPrev,
      'ctrl + ArrowUp': menuController.current?.toFirst,
      'Home': menuController.current?.toFirst,
      'ctrl + ArrowDown': menuController.current?.toLast,
      'End': menuController.current?.toLast
    })
    return subscription.abort
  }, [])
  return { domRef: divRef, controller: menuController }
})
