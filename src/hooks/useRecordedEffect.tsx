import { areShallowEqual, isObject } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'

/**
 * similiar to React.useEffect, but can record dependence list
 *
 * cost:
 * - 1 `React.useEffect()`
 * - 2 `React.useRef()`
 */
export function useRecordedEffect<T extends readonly any[]>(
  effectFn: (prevDependenceList: T | undefined[]) => ((...params: any) => any) | any,
  dependenceList: T,
  options?: {
    /**useful when item of dependenceList is object */
    shallowShallow?: boolean
  }
) {
  const prevValue = useRef<T>([] as unknown as T)
  const cleanupFn = useRef<(() => void) | void>()
  const compareFunction = options?.shallowShallow ? areShallowShallowEqual : areShallowEqual
  useEffect(() => {
    if (prevValue.current.length && compareFunction(prevValue.current, dependenceList)) return cleanupFn.current
    const returnedFn = effectFn(prevValue.current)
    prevValue.current = dependenceList
    cleanupFn.current = returnedFn
    return returnedFn
  }, dependenceList)
}

/**
 * @example
 * areShallowShallowEqual([1, [2]], [1, [2]]) // true
 * areShallowShallowEqual({hello: {hi: 233}}, {hello: {hi: 233}}) // true
 */
export function areShallowShallowEqual(v1: any, v2: any) {
  return isObject(v1) && isObject(v2)
    ? Object.keys(v1).length === Object.keys(v2).length &&
        Object.entries(v1).every(([key, value]) => areShallowEqual(value, v2[key]))
    : areShallowEqual(v1, v2)
}
