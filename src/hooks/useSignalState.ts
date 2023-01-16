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

type SetNewValue<T> = (dispatchAction: T | ((prev: T | undefined) => T)) => void
type GetNewValue<T> = () => T

type PluginFn<T> = (tools: {
  inInit: boolean
  /** pass not variable for through variable may can not get newest value  */
  getValue: GetNewValue<T>
  // TODO get prev value
  setValue: SetNewValue<T>
}) => CleanUpFn | void

export type SignalPluginFn<T, U> = (payload: {
  value: T
  prevValue: T | undefined
  /** true infirst render */
  onInit: (fn: PluginFn<T>) => void
  onUpdate: (fn: PluginFn<T>) => void
  onRender: (fn: PluginFn<T>) => void
  inInit: boolean
  getValue: GetNewValue<T>
  // will not pass through plugin
  setValue: SetNewValue<T>
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
 * export function LoginCard() {
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
export function useSignalState<T, U = never>(
  defaultValue: T | (() => T),
  options?: {
    plugin?: SignalPluginFn<T, U>[]
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

  const pluginCleanUpFns = useRef<{ initCleanUp: CleanUpFn[]; updateCleanUp: CleanUpFn[]; renderCleanUp: CleanUpFn[] }>(
    {
      /** init */
      initCleanUp: [],
      /** not init */
      updateCleanUp: [],
      /** both init and update  */
      renderCleanUp: []
    }
  )

  const inputNewValueRef = useRef<any>() // ref to avoid closure trap
  const getNewValue: GetNewValue<T> = () => inputNewValueRef.current
  const setNewValue: SetNewValue<T> = (dispatch) => _setState(shrinkToValue(dispatch, [stateRef.current]))

  const setState = useCallback((stateDispatch, inInit = false) => {
    const pevValue = stateRef.current
    const newValue = shrinkToValue(stateDispatch, [pevValue])
    inputNewValueRef.current = newValue

    //#region ------------------- pip through plugin -------------------
    let isValid = true

    // invoke prev update cleanup functions
    if (!inInit) {
      pluginCleanUpFns.current.updateCleanUp.forEach((cleanUpFn) => cleanUpFn())
      pluginCleanUpFns.current.updateCleanUp = []
    }

    // invoke prev render cleanup functions
    pluginCleanUpFns.current.renderCleanUp.forEach((cleanUpFn) => cleanUpFn())
    pluginCleanUpFns.current.renderCleanUp = []

    const pluginResult = options?.plugin?.reduce(
      (acc, item) => {
        const pipedValue = item({
          value: acc.overwritedState,
          prevValue: pevValue,
          getValue: getNewValue,
          setValue: setNewValue,
          onInit: (initFn) => {
            if (inInit) {
              const mayCleanFn = initFn({
                inInit,
                getValue: getNewValue,
                setValue: setNewValue
              })
              if (mayCleanFn) pluginCleanUpFns.current.initCleanUp.push(mayCleanFn)
            }
          },
          onUpdate: (initFn) => {
            if (!inInit) {
              const mayCleanFn = initFn({
                inInit,
                getValue: getNewValue,
                setValue: setNewValue
              })
              if (mayCleanFn) pluginCleanUpFns.current.updateCleanUp.push(mayCleanFn)
            }
          },
          onRender: (initFn) => {
            const mayCleanFn = initFn({
              inInit,
              getValue: getNewValue,
              setValue: setNewValue
            })
            if (mayCleanFn) pluginCleanUpFns.current.renderCleanUp.push(mayCleanFn)
          },
          inInit,
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
  useEffect(() => () => pluginCleanUpFns.current.initCleanUp.forEach((cleanUpFn) => cleanUpFn()), [])

  const wrappedSetState = useCallback((dispatch) => setState(dispatch), [])
  return [state, wrappedSetState, signal as any]
}
