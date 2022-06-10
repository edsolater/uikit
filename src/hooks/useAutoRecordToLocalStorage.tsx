import { isExist, isNullish, shrinkToValue } from '@edsolater/fnkit'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect '

// TODO: there should be an export/import button in UI, so that user can export config and paste it to another client.
export default function useAutoRecordToLocalStorage<T>(key: string, state: T) {
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

export function setLocalStorageItem<T = any>(
  key: string,
  dispatcher: ((prev: T | undefined) => T) | T,
  options?: {
    /**
     * if a middleware return undefined, whole action crash.
     */
    middlewares?: ((prev: T | undefined) => T | undefined)[]
  }
) {
  const prev = getLocalStorageItem<T>(key)
  const newValue = shrinkToValue(dispatcher, [prev])
  const parsedValue = (options?.middlewares ?? []).reduce(
    (previouslyParsedValue, middleware) =>
      isExist(previouslyParsedValue) ? middleware(previouslyParsedValue) : previouslyParsedValue,
    newValue as T | undefined
  )
  if (isNullish(parsedValue)) return
  globalThis.localStorage?.setItem(key, JSON.stringify(newValue))
}

export function getLocalStorageItem<T = any>(
  key: string,
  options?: {
    /**
     * if a middleware return undefined, whole action crash.
     */
    middlewares?: ((prev: T | undefined) => T | undefined)[]
  }
): T | undefined {
  const storedValue = globalThis.localStorage?.getItem(key)
  const newValue = isExist(storedValue) ? JSON.parse(storedValue) : undefined
  const parsedValue = (options?.middlewares ?? []).reduce(
    (previouslyParsedValue, middleware) =>
      isExist(previouslyParsedValue) ? middleware(previouslyParsedValue) : previouslyParsedValue,
    newValue as T | undefined
  )
  return parsedValue
}
