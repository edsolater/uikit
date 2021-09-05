import { isExist } from '@edsolater/fnkit/src/judgers'
import type { SetStateAction } from 'react'
import { useEffect, useRef, useState } from 'react'

export default function usePromisedState<S = undefined>(
  initialState?: S | (() => S)
): [S, (value: SetStateAction<S>) => Promise<S>] {
  const [state, setState] = useState(initialState)
  const promiseResolve = useRef<(value: S) => void>()
  useEffect(() => {
    if (isExist(state) && isExist(promiseResolve.current)) {
      promiseResolve.current(state)
    }
  }, [state])
  const setStateWithCallback = (value: SetStateAction<S>) =>
    new Promise<S>((resolve) => {
      setState(value)
      promiseResolve.current = resolve
    })
  return [state, setStateWithCallback]
}
