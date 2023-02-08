import { useEffect, useRef } from 'react'
import { ElementRefs, getElementsFromRefs } from '../../utils/react/getElementsFromRefs'


/** for build-in ResizeObserverEntry need narrows down target manually which is tedious */
interface GenericResizeObserverEntry<El extends HTMLElement> extends ResizeObserverEntry {
  readonly target: El
}

export function useResizeObserver<El extends HTMLElement>(
  ref: ElementRefs,
  callback: (entry: GenericResizeObserverEntry<El>, prevEntry: GenericResizeObserverEntry<El> | undefined) => void,
  options?: {
    init?: boolean
  }
) {
  const entryObjStack = useRef(new Map<HTMLElement, GenericResizeObserverEntry<El>[]>())
  const haveInit = useRef(options?.init)
  useEffect(() => {
    const els = getElementsFromRefs(ref)
    const observer = new ResizeObserver((entries, observer) => {
      entries.forEach((entry: GenericResizeObserverEntry<any>) => {
        // record to map
        const prevStacks = entryObjStack.current.get(entry.target)
        entryObjStack.current.set(entry.target, [...(prevStacks ?? []), entry])
        const prevEntry = prevStacks ? prevStacks[prevStacks.length - 1] : undefined

        // invoke callback
        if (haveInit.current) callback(entry, prevEntry)
        haveInit.current = true
      })
    })
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
