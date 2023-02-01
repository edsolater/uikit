import { MayPromise, shrinkToValue, MayFn } from '@edsolater/fnkit'
import { useRef, useState } from 'react'

import { useAsyncEffect } from './useAsyncEffect'

export function useAsyncMemo<V, F = never>(
  asyncGetValue: MayFn<V>,
  dependencies?: any[],
  fallbackValue?: undefined
): Awaited<V> | undefined
export function useAsyncMemo<V, F = never>(
  asyncGetValue: MayFn<V>,
  dependencies: any[],
  fallbackValue: MayFn<F>
): Awaited<V> | F
export function useAsyncMemo<V, F = never>(
  asyncGetValue: MayFn<V>,
  dependencies?: any[],
  fallbackValue?: MayFn<F>
): Awaited<V> | F | undefined {
  const [valueState, setValueState] = useState(fallbackValue)
  const activeAsyncSetterNumber = useRef(0)
  const asyncSetterNumber = useRef(0)
  useAsyncEffect(async () => {
    // update async setter number
    const actionNumber = asyncSetterNumber.current
    asyncSetterNumber.current += 1
    activeAsyncSetterNumber.current = actionNumber

    const syncValue = await shrinkToValue(asyncGetValue)

    if (actionNumber == activeAsyncSetterNumber.current) {
      //@ts-expect-error force
      return setValueState(syncValue)
    } else {
      // it means: there should be a newer setAsyncState
      return undefined
    }
  }, dependencies)
  return valueState
}
