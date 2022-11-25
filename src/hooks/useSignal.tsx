import { AnyObj, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { Dispatch, SetStateAction, useRef, useCallback, useState, useEffect } from 'react'
import { useCallbackRef } from './useCallbackRef'
import { useRecordedEffect } from './useRecordedEffect'

export type UseSignal<S, AdditionalMethods extends AnyObj = AnyObj> = {
  state(): S
  setState: Dispatch<SetStateAction<S>>
  baseCore: 'state' | 'ref'
} & AdditionalMethods

export function useSignal<T>(
  defaultState: MayFn<T>,
  options?: { stateOrRef?: 'state' | 'ref'; onChange?: (newState: T, prevState?: T) => void }
): UseSignal<T> {
  const { stateOrRef = 'state', onChange } = options ?? {}
  if (stateOrRef === 'ref') {
    const state = useCallbackRef({ defaultValue: shrinkToValue(defaultState), onChange })
    const setState: Dispatch<SetStateAction<T>> = (dispatch) =>
      (state.current = shrinkToValue(dispatch, [state.current]))
    const getState = useCallback(() => state.current, [state]) // TODO:  should use new react `useEvent()`
    return { state: getState, setState, baseCore: 'ref' }
  } else {
    // IDEA: extract `useCallbackState()`
    const [state, setState] = useState(defaultState)
    useRecordedEffect(
      ([prevState]) => {
        if (prevState !== state) onChange?.(state, prevState)
      },
      [state]
    )
    const getState = () => state
    return { state: getState, setState, baseCore: 'state' }
  }
}
