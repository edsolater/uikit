import { isObject } from '@edsolater/fnkit'
import { UseHoverOptions } from '@edsolater/hookit'
import { handleHover } from '../../../functions/dom/gesture/hover'
import { createCallbackRef } from '../../../hooks/useCallbackRef'
import { AbilityPlugin } from './type'

export const hover: {
  (options: UseHoverOptions): AbilityPlugin
  (onHoverCallback: UseHoverOptions['onHover'], options?: UseHoverOptions): AbilityPlugin
} = (...args) => {
  const options: UseHoverOptions = isObject(args[0]) ? args[0] : { ...args[1], onHover: args[0] }
  const divRef = createCallbackRef<HTMLElement>((el) => {
    handleHover(el, options)
  })
  return { additionalProps: { domRef: divRef } } as AbilityPlugin
}
