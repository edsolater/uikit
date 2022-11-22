import { useRef } from 'react'

export function useInit(initFn: () => void) {
  const hasInited = useRef(false)
  if (!hasInited.current) {
    hasInited.current = true
    initFn()
  }
}
