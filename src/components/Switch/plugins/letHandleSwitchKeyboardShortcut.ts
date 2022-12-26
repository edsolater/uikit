import { useEffect, useRef } from 'react'
import { SwitchController, SwitchCoreProps } from '..'
import { handleKeyboardShortcut } from '../../../functions/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../../../plugins'

export type LetHandleSwitchKeyboardShortcut = {}

export const letHandleSwitchKeyboardShortcut = createPlugin<SwitchCoreProps>(() => {
  const divRef = useRef<HTMLElement>()
  const switchController = useRef<SwitchController>()
  useEffect(() => {
    if (!divRef.current) return
    // TODO make handleKeyboardShortcut use getHTMLElementsFromRefs to get Elements
    const subscription = handleKeyboardShortcut(divRef.current, {
      ' ': () => {
        switchController.current?.toggle()
      }
    })
    return subscription.cancel
  }, [])
  return { domRef: divRef, controller: switchController }
})
