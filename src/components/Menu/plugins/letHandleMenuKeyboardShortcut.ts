import { useEffect, useRef } from 'react'
import { MenuCoreProps } from '..'
import { handleKeyboardShortcut } from '../../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../../../plugins'
import { MenuController } from '../hooks/useMenuControllerRegister'

export type LetHandleMenuKeyboardShortcut = {}

export const letHandleMenuKeyboardShortcut = createPlugin<MenuCoreProps<unknown>>(() => {
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
