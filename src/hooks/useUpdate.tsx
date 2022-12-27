import { useRef, useEffect } from 'react'

export function useUpdate<T extends readonly any[]>(
  effectFn: () => ((...params: any) => any) | any,
  dependenceList?: T
) {
  const hasInited = useRef(false)
  useEffect(() => {
    if (!hasInited.current) {
      hasInited.current = true
      return
    } else {
      return effectFn()
    }
  }, dependenceList)
}
