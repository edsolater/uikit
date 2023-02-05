import { DeMayFn, isPromise, makeTaskAbortable, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { useLayoutEffect, useState } from 'react'

/**
 *
 * (async state have abort system )
 * @example
 * //  async function will cause React component update after it's end
 * const value = useAsynceValue(async () => await Promise.resolve(3))
 * return <div>{value}</div> //it will render nothing first, then will render 3.
 *
 *
 * const value = useAsynceValue(async () => await Promise.resolve(3), 5)
 * return <div>{value}</div> //it will render 5 first, then will render 3.
 */
export function useAsyncValue<V>(asyncGetValue: V, fallbackValue?: V): Awaited<DeMayFn<V>> | undefined
export function useAsyncValue<V>(asyncGetValue: V, fallbackValue: () => V): Awaited<DeMayFn<V>>
export function useAsyncValue<V>(asyncGetValue: V, fallbackValue?: MayFn<V>): Awaited<DeMayFn<V>> | undefined {
  const asyncValue = shrinkToValue(asyncGetValue)
  const [valueState, setValueState] = useState(fallbackValue ?? isPromise(asyncValue) ? undefined : asyncGetValue)
  useLayoutEffect(() => {
    if (isPromise(asyncValue)) {
      const { abort } = makeTaskAbortable(() => asyncValue.then((v) => setValueState(v as Awaited<V>)))
      return abort
    } else {
      setValueState(asyncValue as Awaited<V>)
    }
  }, [asyncValue])
  return valueState as Awaited<DeMayFn<V>> | undefined
}
