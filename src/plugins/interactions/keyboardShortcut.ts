import { useEffect, useRef } from 'react'
import { handleKeyboardShortcut, KeyboardShortcut } from '../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../createPlugin'

export const keyboardShortcut = createPlugin<{
  keyboardShortcutSetting: KeyboardShortcut
  options?: {
    /** this still not prevent **all** brower shortcut (like build-in ctrl T ) */
    // TODO
    preventAllBrowserKeyboardShortcut?: boolean
  }
}>(({ keyboardShortcutSetting, options }) => {
  const divRef = useRef<HTMLElement>()
  useEffect(() => {
    if (!divRef.current) return
    if (!keyboardShortcutSetting) return
    // TODO make handleKeyboardShortcut use getHTMLElementsFromRefs to get Elements
    const subscription = handleKeyboardShortcut(divRef.current, keyboardShortcutSetting)
    return subscription.abort
  }, [divRef, ...(keyboardShortcutSetting ? Object.values(keyboardShortcutSetting) : [])])
  return { domRef: divRef }
})
