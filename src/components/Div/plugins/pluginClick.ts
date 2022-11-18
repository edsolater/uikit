import { isObject } from '@edsolater/fnkit'
import { useClick, UseClickOptions } from '@edsolater/hookit'
import { useRef } from 'react'
import { AbilityPlugin } from './type'

/** used in user's use action */
export const click: {
  (options: UseClickOptions): AbilityPlugin
  (onClickCallback: UseClickOptions['onClick'], options?: UseClickOptions): AbilityPlugin
} = (...args) => {
  const options: UseClickOptions = isObject(args[0]) ? args[0] : { ...args[1], onClick: args[0] }
  const divRef = useRef<any>(null)
  useClick(divRef, options)
  return { additionalProps: { domRef: divRef } } as AbilityPlugin
}
