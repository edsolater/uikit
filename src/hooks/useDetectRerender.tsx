import { useRecordedEffect } from './useRecordedEffect'

/**
 * debug react rerender
 * if watchedValue cause rerender, it will invoke callback
 * @param watchedValue
 * @param cb
 */
export function useDetectRerender<T>(watchedValue: T, cb?: (cur: T, prev: T | undefined) => void) {
  useRecordedEffect(
    ([prevWatchedValue]) => {
      cb?.(watchedValue, prevWatchedValue)
    },
    [watchedValue]
  )
}
