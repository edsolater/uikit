import { AnyFn, isFunction } from '@edsolater/fnkit'

type CleanFunction = () => void

export type ObservableValue<T> = {
  (): T
  val: T
  set(newValue: T): void
  onChange(cb: (newValue: T, prevValue: T) => void | CleanFunction): void
}

export function createObserveValue<T>(v: T): ObservableValue<T> {
  let innerValue = v
  const cbs = [] as AnyFn[]
  const callbackCleanFn = [] as (void | CleanFunction)[]
  const set: ObservableValue<T>['set'] = (newValue) => {
    const oldValue = innerValue
    innerValue = newValue
    callbackCleanFn.forEach((cleanFn) => isFunction(cleanFn) && cleanFn())
    callbackCleanFn.splice(0, callbackCleanFn.length)
    cbs.forEach((cb) => {
      const clean = cb(newValue, oldValue)
      callbackCleanFn.push(clean)
    })
  }
  const onChange: ObservableValue<T>['onChange'] = (cb) => {
    cbs.push(cb)
  }
  return new Proxy(
    {
      get val() {
        return innerValue
      },
      set,
      onChange
    },
    {
      apply: () => innerValue
    }
  ) as ObservableValue<T>
}
