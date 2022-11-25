import { WeakerMap, EventCenter, createEventCenter } from '@edsolater/fnkit'
import { useState, useEffect } from 'react'

const globalStateMap = new WeakerMap<string, EventCenter<{ update: React.Dispatch<React.SetStateAction<any>> }>>()

export function useGlobalState<T>(key: string): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>]
export function useGlobalState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>]
export function useGlobalState<T>(key: string, defaultValue?: T) {
  // regist a eventCenter to hole force forceUpdate
  const eventCenter = (() => {
    if (!globalStateMap.has(key)) {
      globalStateMap.set(key, createEventCenter())
    }
    return globalStateMap.get(key)!
  })()

  const [state, originalSetState] = useState(defaultValue)

  useEffect(() => {
    const subscription = eventCenter.onUpdate((v) => {
      originalSetState(v)
    })
    return subscription.unsubscribe
  }, [])

  const wrappedSetState = (dispatcher) => {
    eventCenter.emit('update', [dispatcher])
  }
  return [state, wrappedSetState]
}
