import { AnyFn } from '@edsolater/fnkit'
import { useRef, useLayoutEffect, useCallback } from 'react'

/**@see https://juejin.cn/post/7094453522535546893 */
export function useEvent(handler) {
  const handlerRef = useRef<AnyFn>()

  useLayoutEffect(() => {
    handlerRef.current = handler
  })

  return useCallback((...args) => {
    const fn = handlerRef.current
    return fn?.(...args)
  }, [])
}
