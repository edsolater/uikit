import { useRef, useEffect } from 'react'
import { createPlugin } from '../createPlugin'

export const autoFocus = createPlugin<{
  disable?: boolean
}>(({ disable }) => {
  const self = useRef<HTMLElement>()

  useEffect(() => {
    if (!self.current) return
    if (disable) return
    if (self.current.tabIndex < 0) self.current.tabIndex = 0
    self.current.focus()
  }, [self, disable])

  return { domRef: self }
})
