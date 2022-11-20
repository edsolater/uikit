import { isObject } from '@edsolater/fnkit'
import { handleHover, HandleHoverOptions } from '../../../functions/dom/gesture/handleHover'
import { createCallbackRef } from '../../../hooks/useCallbackRef'
import { createNormalPlugin } from './createPlugin'

export const hover = createNormalPlugin(
  (...args: [HandleHoverOptions] | [onHoverCallback: HandleHoverOptions['onHover'], options?: HandleHoverOptions]) => {
    const options = (isObject(args[0]) ? args[0] : { ...args[1], onHover: args[0] }) as HandleHoverOptions
    const divRef = createCallbackRef<HTMLElement>((el) => {
      handleHover(el, options)
    })
    return { domRef: divRef }
  }
)
