import { isExist } from '@edsolater/fnkit/src/judgers'
import type { SetStateAction } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * just like React build-in `useState()`, but with callback support
 * callback will be invoked after setState() and in useEffect() lifetime
 * @example
 * const [currentClassName, setcurrentClassName] = useThenableState<string>()
 * setcurrentClassName(enterFromClassName).then(() => {
 *   // do when setState() succeed
 * })
 */
export default function useThenableState<S = undefined>(): [
  S | undefined,
  (value: SetStateAction<S | undefined>) => Promise<S | undefined>
]
export default function useThenableState<S>(initialState: S | (() => S)): [S, (value: SetStateAction<S>) => Promise<S>]
export default function useThenableState(initialState?: any) {
  const [state, setState] = useState(initialState)
  const promiseResolve = useRef<any>()
  useEffect(() => {
    if (isExist(state) && isExist(promiseResolve.current)) {
      promiseResolve.current(state)
    }
  }, [state])
  const setStateWithCallback = (value) =>
    new Promise((resolve) => {
      setState(value)
      promiseResolve.current = resolve
    })
  return [state, setStateWithCallback]
}
