import { shrinkToValue } from '@edsolater/fnkit'
import { useCallback, useEffect, useMemo } from 'react'
import { useRef, useState } from 'react'
import { useInit } from './useInit.temp'

type Signal<T> = {
  (): T | undefined
  setState: React.Dispatch<React.SetStateAction<T>>
  state: T | undefined
}

type CleanUpFn = () => any

type PluginInitFn<T> = (tools: {
  /** pass not variable for through variable may can not get newest value  */
  getValue: () => T
  setValue: (dispatchAction: T | ((prev: T | undefined) => T)) => void
}) => CleanUpFn | void

export type PluginFn<T, U> = (payload: {
  value: T
  prevValue: T | undefined
  /** true infirst render */
  onInit: (fn: PluginInitFn<T>) => void
  inInit: boolean
  // will not pass through plugins
  setState: React.Dispatch<React.SetStateAction<T>>
  signal: Signal<T>
  preventSetState: () => void
}) => {
  /* usually don't need this  */
  overwritedState?: T /* piplined state */
  additionalSignalMethods?: U
  /** only for complicated twin plugin, (maybe useless) */
  infoForNextPlugin?: unknown
} | void
/**
 * export state and state and signal in order
 *
 * so it extends build-in `setState()`
 * - before: `const [foo, setFoo] = useState(0)`
 * - after: `const [foo, setFoo, fooSignal] = useSignalState(0)`
 * **no need to change other code where use `foo` and `setFoo`, cause api is compatiable**
 *
 * if prefer merged fn version, please use {@link useSignal} instead
 *
 * @example
 * export default function LoginCard() {
 *   const [foo, setFoo, fooSignal] = useSignalState(0)
 *   useEffect(() => {
 *     const timoutId = setInterval(() => {
 *       setFoo((s) => s + 1)
 *       console.log('foo: ', fooSignal())
 *     }, 1000)
 *     return () => clearInterval(timoutId)
 *   }, [])
 *   return (
 *     <Card>
 *       <h1>Login {foo}</h1>
 *     </Card>
 *   )
 * }
 */
export function useSignalState<T, U>(
  defaultValue: T | (() => T),
  options?: {
    plugin?: PluginFn<T, U>[]
  }
): [
  state: T,
  setState: React.Dispatch<React.SetStateAction<T>>,
  signal: any extends U ? Signal<T> : U /* just want to merge additionalSignalMethods */
] {
  const [state, _setState] = useState(defaultValue)
  const stateRef = useRef(state)
  const signal = useMemo(
    () =>
      Object.assign(() => stateRef.current, {
        setState: (dispatch) => setState(dispatch),
        get state() {
          return stateRef.current
        },
        getState() {
          return stateRef.current
        }
      }),
    []
  )

  const pluginCleanUpFns = useRef<CleanUpFn[]>([])

  const inputNewValueRef = useRef<any>() // ref to avoid closure trap

  const setState = useCallback((stateDispatch, inInit = false) => {
    const pevValue = stateRef.current
    const newValue = shrinkToValue(stateDispatch, [pevValue])
    inputNewValueRef.current = newValue

    //#region ------------------- pip through plugins -------------------
    let isValid = true

    const pluginResult = options?.plugin?.reduce(
      (acc, item) => {
        const pipedValue = item({
          value: acc.overwritedState,
          prevValue: pevValue,
          onInit: (initFn) => {
            if (inInit) {
              const mayCleanFn = initFn({
                getValue: () => inputNewValueRef.current,
                setValue: (dispatch) => _setState(shrinkToValue(dispatch, [stateRef.current]))
              })
              if (mayCleanFn) pluginCleanUpFns.current.push(mayCleanFn)
            }
          },
          inInit,
          setState: _setState,
          signal: acc.additionalSignalMethods,
          preventSetState: () => {
            isValid = false
          }
        })

        return {
          infoForNextPlugin: pipedValue?.infoForNextPlugin,
          overwritedState: pipedValue?.overwritedState ?? acc.overwritedState,
          additionalSignalMethods: Object.assign(acc.additionalSignalMethods, pipedValue?.additionalSignalMethods)
        }
      },
      { overwritedState: newValue, additionalSignalMethods: signal }
    )
    const parsedValue = pluginResult?.overwritedState ?? newValue
    const additionSignal = pluginResult?.additionalSignalMethods

    // load additionalSignalMethods for signal
    // ! it also means plugin must have init render
    Object.assign(signal, additionSignal)

    //#endregion

    if (isValid) {
      stateRef.current = parsedValue
      if (!inInit) _setState(parsedValue)
    }
  }, [])

  useInit(() => {
    // initly attach additionalSignalMethods
    setState(defaultValue, true)
  })

  // finally invoke all cleanup fn
  useEffect(() => () => pluginCleanUpFns.current.forEach((cleanUpFn) => cleanUpFn()), [])

  const wrappedSetState = useCallback((dispatch) => setState(dispatch), [])
  return [state, wrappedSetState, signal as any]
}
