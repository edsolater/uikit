import { shrinkToValue } from '@edsolater/fnkit'
import { useCallback } from 'react'
import { useRef, useState } from 'react'

/**
 * @tested
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

export function useSignalState<T = undefined>(): [
  state: T | undefined,
  setState: React.Dispatch<React.SetStateAction<T | undefined>>,
  signal: () => T | undefined
]

export function useSignalState<T = undefined>(
  defaultValue: T | (() => T)
): [state: T, setState: React.Dispatch<React.SetStateAction<T>>, signal: () => T]

export function useSignalState<T = undefined>(defaultValue?: T | (() => T)) {
  const [state, _setState] = useState(defaultValue)
  const ref = useRef(state)
  const setState = useCallback(
    (stateDispatch) => {
      const pevValue = ref.current
      const newValue = shrinkToValue(stateDispatch, [pevValue])
      ref.current = newValue
      _setState(newValue)
    },
    [_setState]
  )

  const superState = () => ref.current
  superState.setState = setState

  return [state, setState, superState]
}
