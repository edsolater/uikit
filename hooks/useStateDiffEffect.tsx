import { areShallowEqual, isObject } from '@edsolater/fnkit/src/judgers'
import { useEffect, useRef } from 'react'

/**
 * similiar to React.useEffect, but can record dependence list
 */
export default function useStateDiffEffect<T extends any[]>(
  dependenceList: T,
  callback: (curr: T, prev: T | [undefined]) => (() => void) | void,
  options?: {
    /**useful when item of dependenceList contain object */
    shallowShallow?: boolean
  }
) {
  const prevValue = useRef<T>([] as unknown as T)
  const cleanupFn = useRef<(() => void) | void>()
  useEffect(() => {
    const compareFunction = options?.shallowShallow ? areShallowShallowEqual : areShallowEqual
    if (prevValue.current.length && compareFunction(prevValue.current, dependenceList)) return cleanupFn.current
    const returnedFn = callback(dependenceList, prevValue.current)
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
