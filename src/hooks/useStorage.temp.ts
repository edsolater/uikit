import { MayFn } from '@edsolater/fnkit'
import { useCallback, useLayoutEffect, useState } from 'react'
import { getLocalItem, onLocalItemChanged, setLocalItem } from './jStorage'

export default function useLocalStorageItem<T>(
  key: string
): [state: T | undefined, setState: (dispatcher: MayFn<T, [old: T | undefined]>) => void] {
  const [storedValue, setValue] = useState<T>()

  // get from localhost
  useLayoutEffect(() => {
    const storedValue = getLocalItem(key)
    if (storedValue) setValue(storedValue)
    const eventController = onLocalItemChanged((ev) => {
      setValue(ev.json())
    })
    return eventController.abort
  }, [])

  // wrapped setState (will set Localhost)
  const setStoredValue = useCallback((dispatch: MayFn<T, [old: T | undefined]>) => {
    setValue(dispatch)
    if (dispatch) setLocalItem(key, dispatch)
  }, [])

  return [storedValue, setStoredValue]
}
