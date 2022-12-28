import { AnyFn } from '@edsolater/fnkit'
import { useRef, useLayoutEffect, useCallback } from 'react'

/**@see https://juejin.cn/post/7094453522535546893 */
export function useEvent<T extends AnyFn>(handler: T): T {
  const handlerRef = useRef<T>(handler)

  handlerRef.current = handler

  // @ts-ignore
  return useCallback((...args) => {
    const fn = handlerRef.current
    return fn?.(...args)
  }, [])
}
