import { isObject } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'
import { handleHover, HandleHoverOptions } from '../../utils/dom/gesture/handleHover'
import { createPlugin } from '../createPlugin'

export const hover = createPlugin((arg: HandleHoverOptions) => {
  const options = arg
  const divRef = useRef<HTMLElement>()
  useEffect(() => {
    const subscription = handleHover(divRef.current, options)
    return subscription.cancel
  }, [divRef, ...Object.values(options)])
  return { domRef: divRef }
})
