import { MayPromise, shrinkToValue, MayFn } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'

import { useThenableSetState } from './useThenableSetState'

type AsyncDispatch<Value> = MayFn<MayPromise<Value>, [Value]>

/**
 *  !! haven't tested
 *
 * (async state have abort system )
 * @example
 * // state will first 1, then 2, then 5
 * const [asyncState, setAsyncState] = useAsyncState(Promise.resolve(2), 1)
 * useEffect(() => {
 *   globalThis.setTimeout(() => {
 *     setAsyncState(async (oldAsyncState) => await Promise.resolve(5))
 *   }, 1000)
 * }, [])
 */
export function useAsyncState<V>(
  asyncGetValue: MayFn<MayPromise<V>, [undefined]>
): [asyncState: V | undefined, setAsyncState: (asyncDispatch: AsyncDispatch<V>) => Promise<V>]
export function useAsyncState<V, F>(
  asyncGetValue: MayFn<MayPromise<V>, [defaultValue: F]>,
  defaultValue: MayFn<F>
): [asyncState: V | F, setAsyncState: (asyncDispatch: AsyncDispatch<V>) => Promise<V>]

export function useAsyncState(
  asyncGetValue: MayFn<MayPromise<unknown>, [defaultValue: unknown]>,
  defaultValue?: MayFn<unknown>
): [asyncState: unknown, setAsyncState: (asyncDispatch: AsyncDispatch<unknown>) => Promise<unknown>] {
  const [valueState, setValueState] = useThenableSetState<unknown>(defaultValue)

  const activeAsyncSetterNumber = useRef(0)
  const asyncSetterNumber = useRef(0)

  async function setAsyncState(asyncDispatch: AsyncDispatch<unknown>) {
    // update async setter number
    const actionNumber = asyncSetterNumber.current
    asyncSetterNumber.current += 1
    activeAsyncSetterNumber.current = actionNumber

    //@ts-expect-error force
    const syncValue = await shrinkToValue(asyncDispatch, [valueState])

    if (actionNumber == activeAsyncSetterNumber.current) {
      return setValueState(syncValue)
    } else {
      // there is a newer setAsyncState occur
      return undefined
    }
  }

  useEffect(() => {
    setAsyncState(asyncGetValue)
  }, [])

  return [valueState, setAsyncState]
}
