import { useEffect, useSyncExternalStore } from 'react'

export function useTitle(nextTitle?: string) {
  const getSnapshot = () => {
    if (typeof document === 'undefined') {
      return nextTitle ?? ''
    }

    return document.title
  }

  const subscribe = (onStoreChange: () => void) => {
    if (typeof document === 'undefined') {
      return () => {}
    }

    const observer = new MutationObserver(() => {
      onStoreChange()
    })

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => observer.disconnect()
  }

  useEffect(() => {
    if (
      typeof document === 'undefined' ||
      typeof nextTitle !== 'string' ||
      nextTitle.length === 0 ||
      document.title === nextTitle
    ) {
      return
    }

    document.title = nextTitle
  }, [nextTitle])

  return useSyncExternalStore(subscribe, getSnapshot, () => nextTitle ?? '')
}