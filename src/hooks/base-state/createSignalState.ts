/**
 * SignalState 容器实现。
 *
 * 这个文件处在 base-state 的底层容器阶段，
 * 只负责把单一整体状态落到 Solid signal，并暴露当前这版的 signal 读写入口。
 *
 * 它负责：
 * - 创建 signal 容器。
 * - 把 signal 读取器包装成统一的 State 协议。
 * - 承接 signal 模式当前这一版的一次性写入与初始来源跟随。
 *
 * 它不负责：
 * - 解释 store 的字段级语义。
 * - 定义 State 的协议边界。
 * - 定义 MayState 的读取边界。
 * - 承担未来统一的活水源连接管理抽象。
 *
 * 相邻分工：
 * - createState.ts 负责决定何时选择 signal 模式。
 * - state/state.ts 负责 State 协议本身。
 * - state/read.ts 负责 MayState 的最终读取。
 */
import { createEffect, createSignal, on, type Accessor } from 'solid-js'
import { isState, toState, type State } from './state/state'
import { $, type MayState } from './state/read'
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
