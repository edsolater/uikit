import { isFunction, isObject, shrinkFn, type MayFn } from '@edsolater/fnkit'
import { createSignal } from 'solid-js'
import { createReactionFn } from './createReactiveRunner'
import {
  isPromiseLike,
  toStateViewFromPromiseLike,
  type PromiseLikeStateViewOptions,
} from './promise-like'
import { val, type Source } from './read'

export const stateViewBrand = Symbol('StateView')
export const stateBrand = Symbol('State')

export interface StateView<T = any> {
  /**
   * 唯一的读取自身当前值的入口
   * 写业务时，不直接使用这个方法，因为会产生主语错误，尽量使用 {@link state} 来快将任何值包装成state
   * 这里是底层实现，如，{@link val} 与 {@link mapState} 与 {@link followState}
   */
  read(): T

  /** 确定物种是个 readable state，isStateView 使用 */
  [stateViewBrand]: true

  /* 创建一个新的派生 readable state */
  map<U>(toNew: (value: T) => U | StateView<U>): StateView<U>
}

export interface State<T = any> extends StateView<T> {
  /** 确定物种是个state，isState 使用 */
  [stateBrand]: true

  /** 新JS语法， 销毁时自动调用 */
  [Symbol.dispose](): void

  /* 虽然返回自身，但实际上只是改变这个state的值，这个state因为它是对象还是这个state */
  set(newValue: T | ((prev: T) => T)): State<T>
}

/**
 * 方便以后统一管控
 */
const registeredStateSet = new WeakSet<State>()

export function isStateView(value: unknown): value is StateView {
  return (
    registeredStateSet.has(value as any) ||
    (isObject(value) && ((value as any)?.[stateViewBrand] === true || (value as any)?.[stateBrand] === true))
  )
}

/**
 * 判断一个值是否是我们创造的 state。
 * 在管理用的 createState中使用
 */
export function isState(value: unknown): value is State {
  return registeredStateSet.has(value as any) || (isObject(value) && (value as any)?.[stateBrand] === true)
}

/**
 * 创建一个代表状态的，可以读，可以follow的 state。
 *
 * 比 {@link state} 更强调操作行为，常用于组件的构建
 * @param initialValue 初始值
 * @returns 新创建的 state
 * @example
 * ```ts
 * function Component() {
 *   const count = createState(0) // count 是一个 State<number>
 *   return <div>{val(count)}</div>
 * }
 * ```
 *
 * @todo
 * 🤔 是不是搞成proxy效果更好，虽然看起来规模很小，还说其实并不重要？
 */
export function createState<T = unknown>(): State<T | undefined>
export function createState<T = unknown>(initialValue: MayFn<T>): State<T>
export function createState<T = unknown>(initialValue?: MayFn<T>): State<any> {
  const [solidjsAccessor, solidjsSetSignal] = createSignal(shrinkFn(initialValue)) // 这里不应该使用跟随，不然的话语义就不对了
  const thisState: State = {
    read() {
      return solidjsAccessor()
    },
    
    [stateViewBrand]: true,
    [stateBrand]: true,
    [Symbol.dispose]() {
      // 这里不需要做任何事情，因为我们没有在外部注册这个 state，也没有暴露任何取消订阅的接口。
      // 只要这个 state 没有被外部引用了，它就会被垃圾回收掉，Solid 的 createEffect 也会自动清理对它的订阅。
    },
    set(newValue) {
      solidjsSetSignal(isFunction(newValue) ? newValue : () => newValue)
      return thisState
    },
    map(toNew) {
      const mappedState = createState()
      createReactionFn(() => {
        const sourceValue = val(thisState)
        const newValue = val(toNew(sourceValue))
        mappedState.set(newValue)
      })
      return mappedState as State<any>
    },
  }

  // 注册这个 state，以便于未来的管控
  registeredStateSet.add(thisState)

  return thisState
}

/**
 * 【工具函数：转换包装器】将可转换的数据格式统一转换成 StateView。
 *
 * 这是 StateView 转换能力的统一入口。当前支持普通值、StateView 与 PromiseLike；
 * 以后新增可转换的数据格式时，也应在这里识别并分派到对应领域的转换函数。
 *
 * PromiseLike 的具体转换由 {@link toStateViewFromPromiseLike} 负责，
 * 本函数只负责选择转换方式，并提供可选的映射能力。
 *
 * PromiseLike 未提供 defaultValue 时转换为 `StateView<V | undefined>`；
 * 提供 defaultValue 后，pending 使用该值；rejected 可通过 errorValue 与 onRejected 分别定义状态值和事件。
 *
 * 第二个参数可以是 Source 的映射函数，也可以是 PromiseLike 的转换选项。
 *
 * @example
 * ```ts
 * const readable = toStateView(source)
 * ```
 */
export function toStateView<V>(sourceOrValue: StateView<V>): StateView<V>
export function toStateView<R, D, E>(
  sourceOrValue: PromiseLike<R>,
  options: PromiseLikeStateViewOptions<D, E> & { errorValue: E },
): StateView<Awaited<R> | D | E>
export function toStateView<R, D>(
  sourceOrValue: PromiseLike<R>,
  options: PromiseLikeStateViewOptions<D>,
): StateView<Awaited<R> | D>
export function toStateView<R>(sourceOrValue: PromiseLike<R>): StateView<Awaited<R> | undefined>
export function toStateView<R, U>(
  sourceOrValue: PromiseLike<R>,
  mapFn: (value: Awaited<R> | undefined) => U | StateView<U>,
): StateView<U>
export function toStateView<V>(sourceOrValue: Source<V>): StateView<V>
export function toStateView<V, U>(
  sourceOrValue: Source<V>,
  mapFn: (value: V) => U | StateView<U>,
): StateView<U>
export function toStateView<V, U, D>(
  sourceOrValue: Source<V> | PromiseLike<V>,
  mapFnOrOptions?: ((value: V) => U | StateView<U>) | PromiseLikeStateViewOptions<D, unknown>,
): StateView<any> {
  if (isPromiseLike(sourceOrValue)) {
    if (isFunction(mapFnOrOptions)) {
      return toStateViewFromPromiseLike(sourceOrValue).map(mapFnOrOptions as any)
    }
    return mapFnOrOptions
      ? toStateViewFromPromiseLike(sourceOrValue, mapFnOrOptions)
      : toStateViewFromPromiseLike(sourceOrValue)
  }

  if (isStateView(sourceOrValue)) {
    return isFunction(mapFnOrOptions) ? sourceOrValue.map(mapFnOrOptions as any) : sourceOrValue
  }

  const stateView = createState(sourceOrValue)
  return isFunction(mapFnOrOptions) ? stateView.map(mapFnOrOptions as any) : stateView
}
