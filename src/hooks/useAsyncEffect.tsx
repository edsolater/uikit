import { isFunction, MayPromise } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'

export function useAsyncEffect<CleanFn>(asyncEffect: () => MayPromise<CleanFn>, dependenceList?: any[]): void {
  const cleanFunction = useRef<CleanFn>()
  useEffect(() => {
    Promise.resolve(asyncEffect()).then((cleanFn) => (cleanFunction.current = cleanFn))
    return () => {
      if (isFunction(cleanFunction.current)) cleanFunction.current()
    }
  }, dependenceList)
}
