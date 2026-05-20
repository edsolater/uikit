import { createSignal, type Accessor } from 'solid-js'

export function createSignalState<T>(initialValue: T | undefined): [SignalState<T>, SignalStateSetter<T>] {
  const [value, setValue] = createSignal(initialValue)
  return [value as SignalState<T>, setValue]
}
export type SignalState<T> = Accessor<T>

// signal 模式的 setter 直接暴露 createSignal 的 setValue
export type SignalStateSetter<T> = (newValue: T | ((prev: T) => T)) => void
