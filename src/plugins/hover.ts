import { isObject } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'
import { handleHover, HandleHoverOptions } from '../functions/dom/gesture/handleHover'
import { createNormalPlugin } from './createPlugin'

export const hover = createNormalPlugin(
  (...args: [HandleHoverOptions] | [onHoverCallback: HandleHoverOptions['onHover'], options?: HandleHoverOptions]) => {
    const options = (isObject(args[0]) ? args[0] : { ...args[1], onHover: args[0] }) as HandleHoverOptions
    const divRef = useRef<HTMLElement>()
    useEffect(() => {
      const subscription = handleHover(divRef.current, options)
      return subscription.cancel
    }, [divRef, ...Object.values(options)])
    return { domRef: divRef }
  }
)
