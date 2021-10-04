import { isExist } from '@edsolater/fnkit/src/judgers'
import { useEffect } from 'react'

// TODO: there should be an export/import button in UI, so that user can export config and paste it to another client.
export default function useStateRecorder<T>(stateKey: string, state: T) {
  useEffect(() => {
    globalThis.localStorage?.setItem(stateKey, JSON.stringify(state))
  }, [state])
}

export function getStateFromStorage(stateKey: string) {
  const storedValue = globalThis.localStorage?.getItem(stateKey)
  return isExist(storedValue) ? JSON.parse(storedValue) : undefined
}
