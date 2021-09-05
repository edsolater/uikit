import useStateRecorder, { getStateFromStorage } from './useStateRecorder'
import useToggle from './useToggle'

export default function useRecordToggle(keyName: string, defaultBoolean?: boolean): ReturnType<typeof useToggle> {
  const [state, controller] = useToggle(getStateFromStorage(keyName) ?? defaultBoolean)
  useStateRecorder(keyName, state)
  return [state, controller]
}
