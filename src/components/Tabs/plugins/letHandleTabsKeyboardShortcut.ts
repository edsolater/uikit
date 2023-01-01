import { useEffect, useRef } from 'react'
import { TabsController, TabsProps } from '..'
import { handleKeyboardShortcut } from '../../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../../../plugins'

export type LetHandleTabsKeyboardShortcut = {}

export const letHandleTabsKeyboardShortcut = createPlugin<TabsProps<unknown>>(() => {
  const divRef = useRef<HTMLElement>()
  const tabsController = useRef<TabsController<unknown>>()
  useEffect(() => {
    if (!divRef.current) return
    // TODO make handleKeyboardShortcut use getHTMLElementsFromRefs to get Elements
    const subscription = handleKeyboardShortcut(divRef.current, {
      'ArrowRight': tabsController.current?.toNext,
      'ArrowLeft': tabsController.current?.toPrev,
      'ctrl + ArrowLeft': tabsController.current?.toFirst,
      'Home': tabsController.current?.toFirst,
      'ctrl + ArrowRight': tabsController.current?.toLast,
      'End': tabsController.current?.toLast
    })
    return subscription.abort
  }, [])
  return { domRef: divRef, controller: tabsController }
})
