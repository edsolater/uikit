import { isObject } from '@edsolater/fnkit'
import { handleClick, HandleClickOptions } from '../../../functions/dom/gesture/handleClick'
import { createCallbackRef } from '../../../hooks/useCallbackRef'
import { AbilityPlugin } from './type'

/** used in user's use action */
export const click: {
  (options: HandleClickOptions): AbilityPlugin
  (onClickCallback: HandleClickOptions['onClick'], options?: HandleClickOptions): AbilityPlugin
} = (...args) => {
  const options: HandleClickOptions = isObject(args[0]) ? args[0] : { ...args[1], onClick: args[0] }
  const divRef = createCallbackRef<HTMLElement>((el) => {
    handleClick(el, options)
  })
  return { additionalProps: { domRef: divRef } } as AbilityPlugin
}
