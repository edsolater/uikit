import { MayPromise } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'
import { useForceUpdate } from './useForceUpdate'

export function useIterable<T>(iterable: MayPromise<AsyncIterable<T> | Iterable<T>>, options?: { groupSize?: number }) {
  const groupSize = options?.groupSize ?? 8
  const [, forceUpdate] = useForceUpdate() // can't use useState, because useState is too slow

  const items = useRef<Awaited<T>[]>([])
  const tempGroup = useRef<Awaited<T>[]>([])

  useEffect(() => {
    let aborted = false
    ;(async () => {
      if (items.current.length) {
        items.current = []
        forceUpdate()
      }
      for await (const item of await iterable) {
        tempGroup.current.push(item)
        if (aborted) return
        if (tempGroup.current.length >= groupSize) {
          items.current.push(...tempGroup.current)
          forceUpdate()
          tempGroup.current = []
        }
      }
      if (tempGroup.current.length) {
        items.current.push(...tempGroup.current)
        forceUpdate()
        tempGroup.current = []
      }
    })()
    return () => {
      aborted = true
    }
  }, [iterable])

  return items.current
}
