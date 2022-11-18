import { areShallowEqual, isNullish, isArray, isObject } from '@edsolater/fnkit'
import { useRecordedEffect } from './useRecordedEffect'

/** can't judege which is newer is firstTime, U counld set conflictMasterSide, ('auto' will respect larger one) */
export function use2StateSyncer<T>({
  state1,
  onState2Changed,
  state2,
  onState1Changed,
  conflictMasterSide = 'state1'
}: {
  state1: T | undefined
  onState2Changed?: (pairValue: T | undefined) => void
  state2: T | undefined
  onState1Changed?: (pairValue: T | undefined) => void
  conflictMasterSide?: 'state1' | 'state2'
}) {
  useRecordedEffect(
    ([prevState1, prevState2]) => {
      if (areShallowEqual(state1, state2)) return

      const canInitlySync =
        isNullish(prevState1) && isNullish(prevState2) && (!isEmtyValue(state1) || !isEmtyValue(state2))
      const state2HasChanged = state1 === prevState1 && !isEmtyValue(state2) && state2 !== prevState2
      const state1HasChanged = state2 === prevState2 && !isEmtyValue(state1) && state1 !== prevState1
      const bothHasChanged = state1 !== prevState1 && state2 !== prevState2

      const shouldUpdateState1 =
        state2HasChanged ||
        (bothHasChanged && conflictMasterSide === 'state2') ||
        (canInitlySync && conflictMasterSide === 'state2')
      const shouldUpdateState2 =
        state1HasChanged ||
        (bothHasChanged && conflictMasterSide === 'state1') ||
        (canInitlySync && conflictMasterSide === 'state1')

      shouldUpdateState1 && onState2Changed?.(state2)
      shouldUpdateState2 && onState1Changed?.(state1)
    },
    [state1, state2]
  )
}

function isEmtyValue(obj: any): boolean {
  return isEmtyObject(obj) || isArray(obj) || isNullish(obj)
}

// TODO: temp!!! already move to fnkit, but haven't publish yet
export function isEmtyObject(obj: any): boolean {
  return (isArray(obj) && obj.length === 0) || (isObject(obj) && Object.keys(obj).length === 0)
}
