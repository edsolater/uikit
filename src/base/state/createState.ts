import { createSignal, type Accessor, type Setter } from 'solid-js'
import { createStore, type SetStoreFunction } from 'solid-js/store'

/**
 * State 状态创建入口。
 *
 * 该文件是业务代码接触 Solid 原生状态 API 的边界，
 * 只负责把 signal/store 包装成只读 State 和唯一 setter。
 */

export type SignalState<T> = Accessor<T>
export type StoreState<T> = Accessor<T> & {
  readonly [Key in keyof T]: State<T[Key]>
}
export type State<T> = StoreState<T> | SignalState<T>

export type StateMode = 'signal' | 'store'
export type CreateStateOptions = {
  /** 决定底层使用 signal 还是 store；不传时默认使用 signal。 */
  mode?: StateMode
}

export type SignalStateSetter<T> = Setter<T>
export type StoreStateSetter<Root extends object> = {
  (value: Root | ((previous: Root) => Root)): void
  <Value>(selector: (state: StoreState<Root>) => State<Value>, value: Value | ((previous: Value) => Value)): void
}

type WidenValue<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T extends symbol
          ? symbol
          : T

export function createState<T = undefined>(): [SignalState<T | undefined>, SignalStateSetter<T | undefined>]
export function createState<T extends object>(
  initialValue: T,
  options: CreateStateOptions & { mode: 'store' },
): [StoreState<T>, StoreStateSetter<T>]
export function createState<T>(
  initialValue: T,
  options?: CreateStateOptions & { mode?: 'signal' },
): [SignalState<WidenValue<T>>, SignalStateSetter<WidenValue<T>>]
export function createState<T>(initialValue?: T, options: CreateStateOptions = {}): unknown {
  const mode = options.mode ?? 'signal'

  if (mode === 'signal') {
    const [value, setValue] = createSignal(initialValue)
    return [value as State<T>, setValue]
  } else if (mode === 'store') {
    assertObjectValue(initialValue)
    const [store, setStore] = createStore(initialValue)
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
  return ((...args: [Root | ((previous: Root) => Root)] | [(state: StoreState<Root>) => State<unknown>, unknown]) => {
    const [selectorOrValue, value] = args

    if (args.length === 1) {
      setStore(selectorOrValue as Root)
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
