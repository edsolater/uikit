import { AnyFn } from '@edsolater/fnkit'

export type ObservableValue<T> = {
  (): T
  val: T
  set(newValue: T): void
  onChange(cb: (newValue: T, prevValue: T) => any): void
}

export function createObserveValue<T>(v: T): ObservableValue<T> {
  let innerValue = v
  const cbs = [] as AnyFn[]
  const set: ObservableValue<T>['set'] = (newValue) => {
    const oldValue = innerValue
    innerValue = newValue
    cbs.forEach((cb) => cb(newValue, oldValue))
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
