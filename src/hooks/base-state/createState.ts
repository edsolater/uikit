import { createEffect, on, type Accessor } from 'solid-js'
import { createSignalState, type SignalState, type SignalStateSetter } from './createSignalState'
import { createStoreState, type StoreState, type StoreStateSetter } from './createStoreState'
import { $ } from './readState'

/**
 * State 状态创建入口。
 *
 * 该文件是业务代码接触 Solid 原生状态 API 的边界，
 * 只负责把 signal/store 包装成只读 State 和唯一 setter。
 */
export type State<T> = StoreState<T> | SignalState<T>

export type StateMode = 'signal' | 'store'

export type CreateStateOptions = {
  /** 决定底层使用 signal 还是 store；不传时默认使用 signal。 */
  mode?: StateMode

  /** 是否保持和响应式初始值来源同步；默认为 true */
  followInitial?: boolean
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

  const resolvedInitialValue = $(initialValue) as T | undefined

  const [pureState, pureSetState] = (() => {
    if (mode === 'signal') {
      return createSignalState(resolvedInitialValue)
    } else if (mode === 'store') {
      type O = T extends object ? T : never
      return createStoreState<O>(resolvedInitialValue as O | undefined)
    } else {
      throw new Error(`Unsupported state mode: ${mode}`)
    }
  })() as [State<T>, SignalStateSetter<T> | StoreStateSetter<T>]

  const followInitial = options.followInitial ?? true

  // 如果初始值是响应式来源，则保持和上游同步；如果是普通值，则只在创建时读取一次。
  if (isAccessor(initialValue) && followInitial) {
    // 成用 Solid 的 on，并打开 defer。这样第一次不会触发，后续 source 变化才会进入回调。
    createEffect(
      on(
        initialValue as Accessor<T>,
        (value) => {
          pureSetState(() => value)
        },
        { defer: true },
      ),
    )
  }

  return [pureState, pureSetState]
}
