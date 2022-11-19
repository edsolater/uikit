import { isObject } from '@edsolater/fnkit'
import { handleHover, HandleHoverOptions } from '../../../functions/dom/gesture/handleHover'
import { createCallbackRef } from '../../../hooks/useCallbackRef'
import { AbilityPlugin } from './type'

export const hover: {
  (options: HandleHoverOptions): AbilityPlugin
  (onHoverCallback: HandleHoverOptions['onHover'], options?: HandleHoverOptions): AbilityPlugin
} = (...args) => {
  const options: HandleHoverOptions = isObject(args[0]) ? args[0] : { ...args[1], onHover: args[0] }
  const divRef = createCallbackRef<HTMLElement>((el) => {
    handleHover(el, options)
  })
  return { additionalProps: { domRef: divRef } } as AbilityPlugin
}
