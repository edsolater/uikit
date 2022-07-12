import { MayFn } from '@edsolater/fnkit'
import { getLocalItem, onLocalItemChanged, setLocalItem } from './jStorage'
import { SignalPluginFn, useSignalState } from './useSignalState.temp'

export default function useLocalStorageItem<T>(
  key: string,
  defaultValue?: T
): [state: T | undefined, setState: (dispatcher: MayFn<T, [old: T | undefined]>) => void] {
  const [storedValue, setValue] = useSignalState(defaultValue, {
    plugin: [createLocalStorageItemSignalPlugin(key)]
  })

  return [storedValue, setValue]
}

export const createLocalStorageItemSignalPlugin: <T, U>(key: string) => SignalPluginFn<T, U> =
  (key: string) =>
  ({ value, onInit, inInit }) => {
    onInit(({ getValue, setValue }) => {
      const storedValue = getLocalItem(key)
      if (storedValue !== undefined) setValue(storedValue)
      const eventController = onLocalItemChanged(({ key: eventKey, value: eventValue }) => {
        if (eventKey === key && eventValue !== getValue()) {
          setValue(eventValue)
        }
      })
      return eventController.abort
    })
    if (!inInit) setLocalItem(key, value)
  }
