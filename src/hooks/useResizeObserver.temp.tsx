import { RefObject, useEffect, useRef } from 'react'

import { Nullish } from '@edsolater/fnkit'
import { ElementRefs, getElementsFromRefs } from '../functions/react/getElementsFromRefs'

/** for build-in ResizeObserverEntry need narrows down target manually which is tedious */
interface GenericResizeObserverEntry<El extends HTMLElement> extends ResizeObserverEntry {
  readonly target: El
}

export default function useResizeObserver<El extends HTMLElement>(
  ref: ElementRefs,
  callback: (entry: GenericResizeObserverEntry<El>, prevEntry: GenericResizeObserverEntry<El> | undefined) => void
) {
  const entryObjStack = useRef(new Map<HTMLElement, GenericResizeObserverEntry<El>[]>())
  useEffect(() => {
    const els = getElementsFromRefs(ref)
    const observer = new ResizeObserver((entries, observer) => {
      entries.forEach((entry: GenericResizeObserverEntry<any>) => {
        // record to map
        const prevStacks = entryObjStack.current.get(entry.target)
        entryObjStack.current.set(entry.target, [...(prevStacks ?? []), entry])
        const prevEntry = prevStacks ? prevStacks[prevStacks.length - 1] : undefined

        // invoke callback
        callback(entry, prevEntry)
      })
    })
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
