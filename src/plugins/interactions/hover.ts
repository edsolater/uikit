import { isObject } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'
import { handleHover, HandleHoverOptions } from '../../functions/dom/gesture/handleHover'
import { createPlugx } from '../createPlugin'

export const hover = createPlugx((arg: HandleHoverOptions) => {
  const options = arg
  const divRef = useRef<HTMLElement>()
  useEffect(() => {
    const subscription = handleHover(divRef.current, options)
    return subscription.cancel
  }, [divRef, ...Object.values(options)])
  return { domRef: divRef }
})
