import { isObject } from '@edsolater/fnkit'
import { useHover, UseHoverOptions } from '@edsolater/hookit'
import { useRef } from 'react'
import { AbilityPlugin } from './type'

export const hover: {
  (options: UseHoverOptions): AbilityPlugin
  (onHoverCallback: UseHoverOptions['onHover'], options?: UseHoverOptions): AbilityPlugin
} = (...args) => {
  const options: UseHoverOptions = isObject(args[0]) ? args[0] : { ...args[1], onClick: args[0] }
  const divRef = useRef<any>(null)
  useHover(divRef, options)
  return { additionalProps: { domRef: divRef } } as AbilityPlugin
}
