import { createCallbackRef } from '../hooks/useCallbackRef'
import { createNormalPlugin } from './createPlugin'
import { handleKeyboardShortcut, KeyboardShortcut } from '../functions/dom/gesture/handleKeyboardShortcut'

export const keyboardShortcut = createNormalPlugin(
  (
    keyboardShortcutSetting: KeyboardShortcut,
    options?: {
      /** this still not prevent **all** brower shortcut (like build-in ctrl T ) */
      // TODO
      preventAllBrowserKeyboardShortcut?: boolean
    }
  ) => {
    const divRef = createCallbackRef<HTMLElement>((el) => {
      handleKeyboardShortcut(el, keyboardShortcutSetting)
    })
    return { domRef: divRef }
  }
)
