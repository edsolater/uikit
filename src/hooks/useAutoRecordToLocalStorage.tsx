import { isExist, isNullish } from '@edsolater/fnkit'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { getLocalStorageItem, setLocalStorageItem } from '../utils'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'

// TODO: there should be an export/import button in UI, so that user can export config and paste it to another client.
export function useAutoRecordToLocalStorage<T>(key: string, state: T) {
  useEffect(() => {
    setLocalStorageItem(key, state)
  }, [state])
}

/**
 * @todo options middlewares
 * @returns
 */
export function useStateByLocalStorage<T>(
  key: string
): [state: T | undefined, setState: Dispatch<SetStateAction<T | undefined>>]
export function useStateByLocalStorage<T>(
  key: string,
  defaultValue: T
): [state: T, setState: Dispatch<SetStateAction<T>>]
export function useStateByLocalStorage<T>(
  key: string,
  defaultValue?: T
): [state: T | undefined, setState: Dispatch<SetStateAction<T | undefined>>] {
  const [state, setState] = useState(defaultValue)

  useIsomorphicLayoutEffect(() => {
    const storedValue = getLocalStorageItem<T>(key)
    if (isExist(storedValue)) setState(storedValue)
  }, [])

  useEffect(() => {
    if (isNullish(state)) return
    setLocalStorageItem<T>(key, state)
  }, [state])
  return [state, setState]
}
