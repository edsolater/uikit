import { createEffect, on, type Accessor } from 'solid-js'
import { createSignalState, type SignalState, type SignalStateSetter } from './createSignalState'
import { createStoreState, type StoreState, type StoreStateSetter } from './createStoreState'
import { $ } from './readState'
import type { State } from './state'


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
