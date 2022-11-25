import { isExist } from '@edsolater/fnkit'
import { SetStateAction, useEffect, useRef, useState } from 'react'

/**
 * !! haven't tested
 * just like React build-in `useState()`, but with callback support
 * callback will be invoked after setState() and in useEffect() lifetime
 * @example
 * const [currentClassName, setcurrentClassName] = useThenableState<string>()
 * setcurrentClassName(enterFromClassName).then(() => {
 *   // do when setState() succeed
 * })
 */
export function useThenableSetState<S = undefined>(): [
  S | undefined,
  (value: SetStateAction<S | undefined>) => Promise<S | undefined>
]
export function useThenableSetState<S>(
  initialState: S | (() => S)
): [S, (value: SetStateAction<S>) => Promise<S>]
export function useThenableSetState(initialState?: any) {
  const [state, setState] = useState(initialState)
  const promiseResolve = useRef<any>()
  useEffect(() => {
    if (isExist(state) && isExist(promiseResolve.current)) {
      promiseResolve.current(state)
    }
  }, [state])
  const setStateWithCallback = (value: any) =>
    new Promise((resolve) => {
      setState(value)
      promiseResolve.current = resolve
    })
  return [state, setStateWithCallback]
}
