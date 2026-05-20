import { isAnyKey, isFunction, isObjectLiteral } from '@edsolater/fnkit'
import { createEffect, on, type Accessor } from 'solid-js'
import { createStore as createSolidjsStore, type SetStoreFunction } from 'solid-js/store'
import { $, type MayState } from './readState'
import { isState, toState, type State } from './state'

export type StoreState<T> = State<T> & {
  readonly [Key in keyof T]: StoreState<T[Key]>
}
// store 模式的 setter 需要包装一层实现路径选择。

export type StoreStateSetter<Root> = {
  (setter: BasicStateSetter<Root>, options?: StoreStateSetterOptions): void
  <Key extends keyof Root>(key: Key, setter: BasicStateSetter<Root[Key]>): void
  <Value>(selector: (state: StoreState<Root>) => State<Value>, setter: BasicStateSetter<Value>): void
}

type BasicStateSetter<V> = MayState<V> | ((previous: V) => MayState<V>)
type StoreStateSetterOptions = {
  mergeMode?: 'replace' | /* default */ 'shallow-merge'
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
    },
  }) as StoreState<T>
}
/**
 * 创建 store state 的写入口。
 *
 * 调用方只描述要写入的 state 字段，具体路径转换留在这里完成。
 */
export function createStoreStateSetter<Root>(setStore: SetStoreFunction<Root>): StoreStateSetter<Root> {
  return ((...args: unknown[]) => {
    // StoreStateSetter 有三个重载：
    // 1. setState(setter, options?)：直接传入一个 setter，更新整个 state。
    // 2. setState(key, setter)：传入一个字段和对应的 setter，更新单个字段。
    // 3. setState(selector, setter)：传入一个 selector 选择要更新的字段，和对应的 setter，支持嵌套字段。

    // 情况：[setter: StoreStateSetterValueFunction<Root>, options?: StoreStateSetterOptions]
    if (args.length === 1 || isStateSetterOptions(args[1])) {
      const setter = args[0] as BasicStateSetter<Root>
      const options = args[1] as StoreStateSetterOptions | undefined

      setStore((previous) => {
        const nextValue = resolveBasicStateSetter(setter, previous)
        if (options?.mergeMode === 'replace') {
          return nextValue
        }
        if (!isObjectLiteral(previous) || !isObjectLiteral(nextValue)) {
          return nextValue
        }
        return { ...previous, ...nextValue } as Root
      })
      return
    }

    // 情况：[key:Key, setter: StoreStateSetterValueFunction<Value>]
    if (isAnyKey(args[0])) {
      // @ts-ignore
      setStore(args[0], (previous: unknown) =>
        resolveBasicStateSetter(args[1], previous),
      )
      return
    }


    // 情况：[selector: (state: StoreState<Root>) => State<Value>, setter: StoreStateSetterValueFunction<Value>]
    const selector = args[0] as (state: StoreState<Root>) => State<unknown>
    const path = collectStoreStatePath(selector)

    if (path.length === 0) {
      setStore((previous) => resolveBasicStateSetter(args[1] as BasicStateSetter<Root>, previous))
      return
    }

    ;(setStore as (...args: unknown[]) => void)(...path, (previous: unknown) =>
      resolveBasicStateSetter(args[1] as BasicStateSetter<unknown>, previous),
    )
  }) satisfies StoreStateSetter<Root>
}

/**
 * 统一处理 store setter 的值。
 * @example
 * resolveBasicStateSetter((prev) => prev + 1, 41) //=> 42
 * resolveBasicStateSetter(State) //=> State
 */
function resolveBasicStateSetter<V>(setter: BasicStateSetter<V>, previous: V): V {
  if (isFunction(setter) && !isState(setter)) {
    return $((setter as (previous: V) => MayState<V>)(previous)) as V
  }

  return $(setter) as V
}

function isStateSetterOptions(value: unknown): value is StoreStateSetterOptions {
  return isObjectLiteral(value) && ('mergeMode' in value || Object.keys(value).length === 0)
}

/**
 * 从 selector 中收集 store 字段路径。
 *
 * 这个 proxy 不读取真实状态，只记录调用方选择了哪条写入路径。
 */
function collectStoreStatePath<Root, Value>(selector: (state: StoreState<Root>) => State<Value>): PropertyKey[] {
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
