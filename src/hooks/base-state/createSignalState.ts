import { createEffect, createSignal, on, type Accessor } from 'solid-js'
import { isState, toState, type State } from './state'
import { $, type MayState } from './readState'
import { isFunction } from '@edsolater/fnkit'

export function createSignalState<T>(
  initialValue: T,
  options: { autoPipState: boolean },
): [SignalState<T>, SignalStateSetter<T>] {
  const [value, setValue] = createSignal(initialValue)

  // 保持初始值响应
  if (isState(initialValue) && options.autoPipState) {
    // 成用 Solid 的 on，并打开 defer。这样第一次不会触发，后续 source 变化才会进入回调。
    createEffect(
      on(
        initialValue as Accessor<T>,
        (value) => {
          setValue(() => value)
        },
        { defer: true },
      ),
    )
  }

  const acceptStateSetter: SignalStateSetter<T> = (setter) => {
    if (isFunction(setter) && !isState(setter)) {
      setValue((prev) => {
        const newState = setter(prev)
        return $(newState)
      })
    } else {
      setValue(() => $(setter))
    }
  }

  return [toState(value), acceptStateSetter]
}
export type SignalState<T> = State<T>

// signal 模式的 setter 直接暴露 createSignal 的 setValue
export type SignalStateSetter<T> = (newValue: MayState<T> | ((prev: T) => MayState<T>)) => void
