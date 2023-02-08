import { useLayoutEffect, useRef } from 'react'
import { isHTMLElement } from '../../utils/dom/isHTMLElement'
import { useFRef } from '../useFRef'

type UseIntersectionObserverCallback = (entry: IntersectionObserverEntry) => void
/** regist callback function one by one, not regist entirely */
export function useIntersectionObserver(options?: Omit<IntersectionObserverInit, 'root'>) {
  const rootDom = useRef<HTMLElement>()
  const registedCallbacks = useRef<Map<HTMLElement, UseIntersectionObserverCallback>>(new Map())
  const insersectObserver = useFRef<IntersectionObserver>()
  useLayoutEffect(() => {
    if (!rootDom.current) throw new Error(`${useIntersectionObserver.name}: rootDom is not set`)
    insersectObserver.set(
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const callback = registedCallbacks.current.get(entry.target as any)
            if (callback) callback(entry)
          })
        },
        { root: rootDom.current, ...options }
      )
    )
    return () => {
      insersectObserver.current?.disconnect()
      registedCallbacks.current.clear()
    }
  }, [])

  return {
    rootDom,
    childDomSpawner: {
      spawnRefCallback(options: { observeCallback: UseIntersectionObserverCallback }) {
        return new Proxy(
          { current: undefined },
          {
            set(target, key, value) {
              if (key === 'current') {
                if (isHTMLElement(value)) {
                  insersectObserver.onCurrentSet((insersectObserver) => insersectObserver.observe(value))
                  registedCallbacks.current.set(value, options.observeCallback)
                  return true
                }
                Reflect.set(target, key, value)
              }
              return true
            }
          }
        )
      }
    }
  }
}
