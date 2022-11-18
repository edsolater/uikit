import { isObject } from '@edsolater/fnkit'
import { useHover, UseHoverOptions } from '@edsolater/hookit'
import { useRef } from 'react'
import { AbilityPlugin } from './type'

export const hover: {
  (options: UseHoverOptions): AbilityPlugin
  (onHoverCallback: UseHoverOptions['onHover'], options?: UseHoverOptions): AbilityPlugin
} = (...args) => {
  console.log('load hover')
  const options: UseHoverOptions = isObject(args[0]) ? args[0] : { ...args[1], onClick: args[0] }
  const divRef = useRef<any>(null) // FIXME: should just use js function, not react hooks
  useHover(divRef, options) // FIXME: should just use js function, not react hooks
  return { additionalProps: { domRef: divRef } } as AbilityPlugin
}
