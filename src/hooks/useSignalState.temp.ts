import { shrinkToValue } from '@edsolater/fnkit'
import { useCallback, useMemo } from 'react'
import { useRef, useState } from 'react'

type Signal<T> = {
  (): T | undefined
  setState: React.Dispatch<React.SetStateAction<T | undefined>>
  state: T | undefined
}

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
export function useSignalState<T, U = unknown>(
  defaultValue: T | (() => T),
  options?: {
    plugin?: ((payload: { newState: T; prevState: T; mutableSignal: Signal<T>; preventSetState: () => void }) => {
      handledState: T /* piplined state */
      additionalSignalMethods?: U
    })[]
  }
): [state: T, setState: React.Dispatch<React.SetStateAction<T>>, signal: Signal<T> & U] {
  const [state, _setState] = useState(defaultValue)
  const ref = useRef(state)
  const signal = useMemo(
    () =>
      Object.assign(() => ref.current, {
        setState,
        get state() {
          return ref.current
        }
      }),
    []
  )
  const setState = useCallback(
    (stateDispatch) => {
      const pevValue = ref.current
      const newValue = shrinkToValue(stateDispatch, [pevValue])

      //#region ------------------- pip through  plugins  -------------------
      let isValid = true
      const parsedValue =
        options?.plugin?.reduce(
          (acc, item) => {
            const pipedValue = item({
              newState: acc.handledState,
              prevState: pevValue,
              mutableSignal: acc.additionalSignalMethods,
              preventSetState: () => {
                isValid = false
              }
            })
            return {
              handledState: pipedValue.handledState,
              additionalSignalMethods: Object.assign(acc.additionalSignalMethods, pipedValue.additionalSignalMethods)
            }
          },
          { handledState: newValue, additionalSignalMethods: signal }
        ).handledState ?? newValue
      //#endregion

      if (isValid) {
        ref.current = parsedValue
        _setState(parsedValue)
      }
    },
    [_setState]
  )

  return [state, setState, signal as any]
}
