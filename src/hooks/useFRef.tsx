import { useRef } from 'react'

type UseRefCallback<T> = (currentValue: T) => void
type ProxyRef<T> = {
  readonly current: T
  onCurrentSet(cb: UseRefCallback<T>): void
  onCurrentChange(cb: UseRefCallback<T>): void
  set(value: T): void
}
/**
 *  monitor .current set / change
 *  use `set()` replace `.current = `
 */
export function useFRef<T = any>(defaultValue?: T): ProxyRef<T> {
  // invoke when .current has set (immediately if have defaultValue)
  const setCallbacks = useRef([] as UseRefCallback<T>[])
  // invoke when .current has changed
  const changeCallbacks = useRef([] as UseRefCallback<T>[])

  // @ts-expect-error froce
  const innerValue = useRef<T>(defaultValue)
  const proxyValue = {
    current: innerValue.current,
    onCurrentSet(cb: UseRefCallback<T>) {
      if (!innerValue.current) {
        setCallbacks.current.push(cb)
      } else {
        cb(innerValue.current)
      }
    },
    onCurrentChange(cb: UseRefCallback<T>) {
      setCallbacks.current.push(cb)
    },
    set(value: T) {
      innerValue.current = value
      setCallbacks.current.forEach((cb) => cb(value))
      setCallbacks.current.length = 0 // clear invoked callbacks
      changeCallbacks.current.forEach((cb) => cb(value))
    }
  }

  return proxyValue
}
