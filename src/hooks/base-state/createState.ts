import { createEffect, createSignal, type Accessor } from 'solid-js'
import { createStore, reconcile, type SetStoreFunction } from 'solid-js/store'
import { $ } from './read'

/**
 * State 状态创建入口。
 *
 * 该文件是业务代码接触 Solid 原生状态 API 的边界，
 * 只负责把 signal/store 包装成只读 State 和唯一 setter。
 */

export type SignalState<T> = Accessor<T>
export type StoreState<T> = SignalState<T> & {
  readonly [Key in keyof T]: StoreState<T[Key]>
}
export type State<T> = StoreState<T> | SignalState<T>

export type StateMode = 'signal' | 'store'

export type CreateStateOptions = {
  /** 决定底层使用 signal 还是 store；不传时默认使用 signal。 */
  mode?: StateMode

  /** 是否保持和响应式初始值来源同步；默认为 true */
  syncWithInitial?: boolean
}

// signal 模式的 setter 直接暴露 createSignal 的 setValue
export type SignalStateSetter<T> = (newValue: T | ((prev: T) => T)) => void

// store 模式的 setter 需要包装一层实现路径选择。
export type StoreStateSetter<Root extends object> = {
  (value: Root | ((previous: Root) => Root)): void
  <Key extends keyof Root>(key: Key, value: Root[Key] | ((previous: Root[Key]) => Root[Key])): void
  <Value>(selector: (state: StoreState<Root>) => State<Value>, value: Value | ((previous: Value) => Value)): void
}

/**
 * 判断值是否是 Solid 的 Accessor（signal 读取器）。
 *
 * 该函数用于可读性
 * @param value 输入
 */
function isAccessor<T>(value: unknown): value is Accessor<T> {
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
  const syncWithInitial = options.syncWithInitial ?? true

  if (mode === 'signal') {
    const [value, setValue] = createSignal($(initialValue))

    // 如果初始值是响应式来源，则保持和上游同步；如果是普通值，则只在创建时读取一次。
    if (isAccessor(initialValue) && syncWithInitial) {
      createEffect(() => {
        setValue(() => $(initialValue as Accessor<T>))
      })
    }

    

    return [value as State<T>, setValue]
  } else if (mode === 'store') {
    const resolvedInitialValue = $(initialValue)

    assertObjectValue(resolvedInitialValue)

    const [store, setStore] = createStore(resolvedInitialValue)

    // 如果初始值是响应式来源，则保持和上游同步；如果是普通值，则只在创建时读取一次。
    if (isAccessor(initialValue) && syncWithInitial) {
      createEffect(() => {
        setStore(reconcile($(initialValue as Accessor<T & object>)))
      })
    }

    const storeState = createStoreState(() => store)
    return [storeState as State<T>, createStoreStateSetter(setStore)]
  } else {
    throw new Error(`Unsupported state mode: ${mode}`)
  }
}

/**
 * 把读取函数包装成支持字段访问的只读 State。
 *
 * Proxy 只负责读取路径，不提供任何写入方法。
 */
function createStoreState<T>(storeGetter: () => T): State<T> {
  const state = (() => storeGetter()) as State<T>

  return new Proxy(state, {
    // 是为store准备的
    get(target, key, receiver) {
      if (typeof key === 'symbol') {
        return Reflect.get(target, key, receiver)
      }

      return createStoreState(() => {
        const value = storeGetter() as Record<PropertyKey, unknown>
        return value[key]
      })
    },
    apply() {
      return storeGetter()
    },
  })
}

/**
 * 创建 store state 的写入口。
 *
 * 调用方只描述要写入的 state 字段，具体路径转换留在这里完成。
 */
function createStoreStateSetter<Root extends object>(setStore: SetStoreFunction<Root>): StoreStateSetter<Root> {
  return ((
    ...args:
      | [Root | ((previous: Root) => Root)]
      | [keyof Root, unknown]
      | [(state: StoreState<Root>) => State<unknown>, unknown]
  ) => {
    const [selectorOrValue, value] = args

    if (args.length === 1) {
      setStore(selectorOrValue as Root)
      return
    }

    if (typeof selectorOrValue !== 'function') {
      ;(setStore as (...args: unknown[]) => void)(selectorOrValue, value)
      return
    }

    const selector = selectorOrValue as (state: StoreState<Root>) => State<unknown>
    const path = collectStoreStatePath(selector)

    if (path.length === 0) {
      setStore(value as Root)
      return
    }

    ;(setStore as (...args: unknown[]) => void)(...path, value)
  }) as StoreStateSetter<Root>
}

/**
 * 从 selector 中收集 store 字段路径。
 *
 * 这个 proxy 不读取真实状态，只记录调用方选择了哪条写入路径。
 */
function collectStoreStatePath<Root extends object, Value>(
  selector: (state: StoreState<Root>) => State<Value>,
): PropertyKey[] {
  const path: PropertyKey[] = []
  const pathState = createPathState(path)

  selector(pathState as StoreState<Root>)

  return path
}

/**
 * 创建只记录属性访问路径的 State。
 *
 * 该对象只服务 store setter 的 selector，不进入真实渲染读取路径。
 */
function createPathState(path: PropertyKey[]): State<unknown> {
  const state = (() => undefined) as State<unknown>

  return new Proxy(state, {
    get(target, key, receiver) {
      if (typeof key === 'symbol') {
        return Reflect.get(target, key, receiver)
      }

      path.push(key)

      return createPathState(path)
    },
    apply() {
      return undefined
    },
  })
}

/**
 * store 模式要求初始值具备对象形状。
 *
 * 这是显式模式的调用约定，失败说明调用方选错了底层状态能力。
 */
function assertObjectValue(value: unknown): asserts value is object {
  if (typeof value !== 'object' || value === null) {
    throw new Error('store 模式的初始值必须是对象。')
  }
}
