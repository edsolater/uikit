import { AnyObj, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { Dispatch, SetStateAction, useRef, useCallback, useState } from 'react'

export type UseSignal<S, AdditionalMethods extends AnyObj = AnyObj> = {
  state(): S
  setState: Dispatch<SetStateAction<S>>
  baseCore: 'state' | 'ref'
} & AdditionalMethods

/** State + Ref */
export function useSignal<T>(defaultState: MayFn<T>, baseCore: 'state' | 'ref' = 'state'): UseSignal<T> {
  if (baseCore === 'ref') {
    const state = useRef(shrinkToValue(defaultState))
    const setState: Dispatch<SetStateAction<T>> = (dispatch) =>
      (state.current = shrinkToValue(dispatch, [state.current]))
    const getState = useCallback(() => state.current, [state])
    return { state: getState, setState, baseCore: 'ref' }
  } else {
    const [state, setState] = useState(defaultState)
    const getState = () => state
    return { state: getState, setState, baseCore: 'state' }
  }
}
