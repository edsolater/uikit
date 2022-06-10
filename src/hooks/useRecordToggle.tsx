import useAutoRecordToLocalStorage, { getLocalStorageItem } from './useAutoRecordToLocalStorage'
import useToggle from './useToggle'

export default function useRecordToggle(keyName: string, defaultBoolean?: boolean): ReturnType<typeof useToggle> {
  const [state, controller] = useToggle(getLocalStorageItem(keyName) ?? defaultBoolean)
  useAutoRecordToLocalStorage(keyName, state)
  return [state, controller]
}
