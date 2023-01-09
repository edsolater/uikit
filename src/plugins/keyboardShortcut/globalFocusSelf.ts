import { useRef, useEffect } from 'react'
import { handleKeyboardShortcut, KeyboardShortcut } from '../../utils/dom/gesture/handleKeyboardShortcut'
import { createPlugin } from '../createPlugin'

export const globalFocusSelf = createPlugin<{
  focusKeyshort?: keyof KeyboardShortcut
  tabIndex?: number
  disable?: boolean
}>(({ focusKeyshort, tabIndex = 0, disable }) => {
  const self = useRef<HTMLElement>()

  useEffect(() => {
    if (!self.current) return
    if (disable) return
    if (self.current.tabIndex < 0) self.current.tabIndex = tabIndex
    if (focusKeyshort) {
      const subscription = handleKeyboardShortcut(self.current, {
        [focusKeyshort]: () => {
          self.current?.focus()
        }
      })
      return subscription.abort
    }
  }, [self, disable])

  return { domRef: self }
})
