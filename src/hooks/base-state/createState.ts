/**
 * base-state 对外创建入口。
 *
 * 这个文件处在 base-state 的模式分发阶段，
 * 只负责把外部输入分发到 signal 或 store 容器实现，并维持统一的创建入口。
 *
 * 它负责：
 * - 暴露 createState 统一 API。
 * - 定义 signal/store 两种模式的对外返回类型。
 * - 根据 mode 选择底层容器实现。
 *
 * 它不负责：
 * - 实现 signal 容器内部写入细节。
 * - 实现 store 容器内部路径写入细节。
 * - 定义 State 协议和活水源连接细节。
 *
 * 相邻分工：
 * - createSignalState.ts 负责整体状态容器。
 * - createStoreState.ts 负责对象细节容器。
 * - state/ 目录负责 State 协议、读取与派生。
 */
import { createEffect, on, type Accessor } from 'solid-js'
import { createSignalState, type SignalState, type SignalStateSetter } from './createSignalState'
import { createStoreState, type StoreState, type StoreStateSetter } from './createStoreState'
import { $ } from './state/read'
import type { State } from './state/state'


export type StateMode = 'signal' | 'store'

export type CreateStateOptions = {
  /** 决定底层使用 signal 还是 store；不传时默认使用 signal。 */
  mode?: StateMode

  /** 是否保持和响应式初始值来源同步；默认为 true */
  autoPipState?: boolean
}

/**
 * 判断值是否是 Solid 的 Accessor（signal 读取器）。
 *
 * 该函数用于可读性
 * @param value 输入
 */
export function isAccessor<T>(value: unknown): value is Accessor<T> {
  return typeof value === 'function'
}

/**
 * 创建状态。
 *
 * 根据 options.mode 决定创建 signal 还是 store。
 * - signal 模式适合简单状态，性能开销小，API 简单。
 * - store 模式适合复杂对象状态，支持字段访问和部分更新，但性能开销较大。
 *
 * 初始值可以是普通值，也可以是响应式来源（signal/store）。如果是响应式来源，默认保持和上游同步。
 *
 * @example
 * ```ts
 * const [count, setCount] = createState(0)
 *
 * const [user, setUser] = createState({ name: 'Eds', age: 30 }, { mode: 'store' })
 * setUser('name', 'Edsger')
 * setUser((state) => state.age, (age) => age + 1)
 * ```
 */
export function createState<T = undefined>(): [SignalState<T | undefined>, SignalStateSetter<T | undefined>]
export function createState<T extends object>(
  initialValue: T | State<T>,
  options: CreateStateOptions & { mode: 'store' },
): [StoreState<T>, StoreStateSetter<T>]
export function createState<T>(
  initialValue: T | State<T>,
  options?: CreateStateOptions & { mode?: 'signal' },
): [SignalState<T>, SignalStateSetter<T>]
export function createState<T>(initialValue?: T | State<T>, options: CreateStateOptions = {}): unknown {
  const mode = options.mode ?? 'signal'
  const autoPipState = options.autoPipState ?? true

  const resolvedInitialValue = $(initialValue) 

  const [state, setState] = (() => {
    if (mode === 'signal') {
      return createSignalState(resolvedInitialValue, { autoPipState })
    } else if (mode === 'store') {
      type O = T extends object ? T : never
      return createStoreState<O>(resolvedInitialValue as O | undefined, { autoPipState })
    } else {
      throw new Error(`Unsupported state mode: ${mode}`)
    }
  })() as [State<T>, SignalStateSetter<T> | StoreStateSetter<T>]


  return [state, setState]
}
