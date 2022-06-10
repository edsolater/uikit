import { RefObject, useEffect } from 'react'

import { Nullish } from '../typings/constants'

/** for build-in ResizeObserverEntry need narrows down target manually which is tedious */
interface GenericResizeObserverEntry<El extends Element> extends ResizeObserverEntry {
  readonly target: El
}

export default function useResizeObserver<El extends Element>(
  ref: RefObject<El | Nullish>,
  callback: (entry: GenericResizeObserverEntry<El>, observer: ResizeObserver) => void
) {
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver((entries, observer) => {
      entries.forEach((entry) => {
        callback(entry as any, observer)
      })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
}
