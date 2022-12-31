import { useEffect, useRef } from 'react'
import { DrawerController, DrawerProps } from '../Drawer'
import { handleKeyboardShortcut } from '../../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../../../plugins'

export type LetDrawerTrigger = {}

export const letDrawerTrigger = createPlugin<DrawerProps>(() => {
  const divRef = useRef<HTMLElement>()
  const drawerController = useRef<DrawerController>()
  useEffect(() => {
    if (!divRef.current) return
    const subscription = handleKeyboardShortcut(divRef.current, {
      // 'ArrowDown': drawerController.current?.toNext,
      // 'ArrowUp': drawerController.current?.toPrev,
      // 'ctrl + ArrowUp': drawerController.current?.toFirst,
      // 'Home': drawerController.current?.toFirst,
      // 'ctrl + ArrowDown': drawerController.current?.toLast,
      // 'End': drawerController.current?.toLast
    })
    return subscription.abort
  }, [])
  return { domRef: divRef, controller: drawerController }
})
