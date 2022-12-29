import { useEffect, useRef } from 'react'
import { DrawerProps } from '..'
import { handleKeyboardShortcut } from '../../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../../../plugins'
import { DrawerController } from '../hooks/useDrawerControllerRegister'

export type LetHandleDrawerKeyboardShortcut = {}

export const letHandleDrawerKeyboardShortcut = createPlugin<DrawerProps<unknown>>(() => {
  const divRef = useRef<HTMLElement>()
  const drawerController = useRef<DrawerController<unknown>>()
  useEffect(() => {
    if (!divRef.current) return
    const subscription = handleKeyboardShortcut(divRef.current, {
      'ArrowDown': drawerController.current?.toNext,
      'ArrowUp': drawerController.current?.toPrev,
      'ctrl + ArrowUp': drawerController.current?.toFirst,
      'Home': drawerController.current?.toFirst,
      'ctrl + ArrowDown': drawerController.current?.toLast,
      'End': drawerController.current?.toLast
    })
    return subscription.abort
  }, [])
  return { domRef: divRef, controller: drawerController }
})
