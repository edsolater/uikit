import { createEffect, on, type Accessor } from 'solid-js'
import { createStore as createSolidjsStore, type SetStoreFunction } from 'solid-js/store'
import { isState, toState, type State } from './state'

export type StoreState<T> = State<T> & {
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
  options: { autoPipState: boolean },
): [StoreState<T>, StoreStateSetter<T>] {
  assertObjectValue(initialValue)

  // @ts-expect-error 因为 store 模式要求初始值具备对象形状，所以这里直接断言成 T
  // 反正此前已有类型assert，如果类型不对就会直接报错，所以我们这里不用对类型那么苛刻。
  const [store, setStore] = createSolidjsStore<T>(initialValue)

  const storeState = createStoreStateAccessor(() => store as T)
  const setStoreState = createStoreStateSetter(setStore)

  
  // 如果初始值是响应式来源，则保持和上游同步；如果是普通值，则只在创建时读取一次。
  if (isState(initialValue) && options.autoPipState) {
    // 成用 Solid 的 on，并打开 defer。这样第一次不会触发，后续 source 变化才会进入回调。
    createEffect(
      on(
        initialValue as Accessor<T>,
        (value) => {
          setStoreState(() => value)
        },
        { defer: true },
      ),
    )
  }

  return [storeState, setStoreState]
}

/**
 * 把读取函数包装成支持字段访问的只读 State。
 *
 * Proxy 只负责读取路径，不提供任何写入方法。
 */
export function createStoreStateAccessor<T>(readCurrentValue: () => T): StoreState<T> {
  const state = readCurrentValue

  return new Proxy(toState(state), {
    // 是为store准备的
    get(target, key, receiver) {
      if (typeof key === 'symbol') {
        return Reflect.get(target, key, receiver)
      }
      return createStoreStateAccessor(() => {
        const value = target() as Record<PropertyKey, unknown>
        return value[key]
      })
    }
  }) as StoreState<T>
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