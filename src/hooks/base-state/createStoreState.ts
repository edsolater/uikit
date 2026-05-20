import { createStore as createSolidjsStore, type SetStoreFunction } from 'solid-js/store'
import { type State } from './createState'
import type { Accessor } from 'solid-js'

export type StoreState<T> = Accessor<T> & {
  readonly [Key in keyof T]: StoreState<T[Key]>
}
// store 模式的 setter 需要包装一层实现路径选择。

export type StoreStateSetter<Root> = {
  (value: Root | ((previous: Root) => Root)): void
  <Key extends keyof Root>(key: Key, value: Root[Key] | ((previous: Root[Key]) => Root[Key])): void
  <Value>(selector: (state: StoreState<Root>) => State<Value>, value: Value | ((previous: Value) => Value)): void
}



/**
 * store 模式的 createState 实现。
 *
 * 外部入口
 */
export function createStoreState<T>(
  initialValue: T | undefined,
): [StoreState<T>, StoreStateSetter<T>] {
  assertObjectValue(initialValue)
  type StoreRoot = T & object
  const [store, setStore] = createSolidjsStore<StoreRoot>(initialValue as StoreRoot)

  const storeState = createStoreStateAccessor(() => store as T)

  return [storeState, createStoreStateSetter(setStore) as StoreStateSetter<T>]
}

/**
 * 把读取函数包装成支持字段访问的只读 State。
 *
 * Proxy 只负责读取路径，不提供任何写入方法。
 */
export function createStoreStateAccessor<T>(storeGetter: () => T): StoreState<T> {
  const state = (() => storeGetter()) as StoreState<T>

  return new Proxy(state, {
    // 是为store准备的
    get(target, key, receiver) {
      if (typeof key === 'symbol') {
        return Reflect.get(target, key, receiver)
      }

      return createStoreStateAccessor(() => {
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
export function createStoreStateSetter<Root>(setStore: SetStoreFunction<Root>): StoreStateSetter<Root> {
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
function collectStoreStatePath<Root, Value>(
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
export function assertObjectValue(value: unknown): asserts value is object {
  if (typeof value !== 'object' || value === null) {
    throw new Error('store 模式的初始值必须是对象。')
  }
}