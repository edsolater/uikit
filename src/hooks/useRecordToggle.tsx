import { useAutoRecordToLocalStorage } from './useAutoRecordToLocalStorage'
import { useToggle } from './useToggle'
import { getLocalStorageItem } from '../utils'

export function useRecordToggle(keyName: string, defaultBoolean?: boolean): ReturnType<typeof useToggle> {
  const [state, controller] = useToggle(getLocalStorageItem(keyName) ?? defaultBoolean)
  useAutoRecordToLocalStorage(keyName, state)
  return [state, controller]
}
