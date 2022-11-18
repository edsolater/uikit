import { useEffect, useRef } from 'react'

export function useInitFlagDetector() {
  const inInit = useRef(true)
  useEffect(() => () => {
    inInit.current = false
  })
  return inInit.current // Value will only updated by rerender
}
