import { isExist, isNullish } from '@edsolater/fnkit/src/judgers'
import { createRef, useRef } from 'react'

/**
 * @return proxied { current: xxx }
 */
export default function useCallbackRef<T = unknown>(callback: (current: T) => void) {
  const originalRef = useRef<T>()
  const proxied = useRef(
    new Proxy(originalRef, {
      set(target, p, value) {
        if (isExist(value) && isNullish(target.current)) {
          callback(value)
          return Reflect.set(target, p, value)
        }
        return true
      }
    })
  )
  return proxied.current
}

export function createCallbackRef<T = unknown>(callback: (current: T) => void) {
  const originalRef = createRef<T>()
  return new Proxy(originalRef, {
    set(target, p, value) {
      callback(value)
      return Reflect.set(target, p, value)
    }
  })
}
