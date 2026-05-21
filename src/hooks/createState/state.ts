import { isFunction, isObject, shrinkFn, type MayFn } from '@edsolater/fnkit'
import { createEffect, createSignal, on, type Accessor } from 'solid-js'
import { createReactiveRunner } from './createReactiveRunner'
import { val, type Source } from './read'

export const readableStateBrand = Symbol('ReadableState')
export const stateBrand = Symbol('State')

export interface ReadableState<T = any> {
  /**
   * 唯一的读取自身当前值的入口
   * 写业务时，不直接使用这个方法，因为会产生主语错误，尽量使用 {@link state} 来快将任何值包装成state
   * 这里是底层实现，如，{@link val} 与 {@link mapState} 与 {@link followState}
   */
  read(): T

  /** 确定物种是个 readable state，isReadableState 使用 */
  [readableStateBrand]: true

  /* 创建一个新的派生 readable state */
  map<U>(toNew: (value: T) => U | ReadableState<U>): ReadableState<U>
}

export interface State<T = any> extends ReadableState<T> {
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

export function isReadableState(value: unknown): value is ReadableState {
  return (
    registeredStateSet.has(value as any) ||
    (isObject(value) && ((value as any)?.[readableStateBrand] === true || (value as any)?.[stateBrand] === true))
  )
}

/**
 * 判断一个值是否是我们创造的 state。
 * 在管理用的 createState中使用
 */
export function isState(value: unknown): value is State {
  return registeredStateSet.has(value as any) || (isObject(value) && (value as any)?.[stateBrand] === true)
}

function isAccessor(value: unknown): value is Accessor<any> {
  return isFunction(value) && value.length === 0
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
 */
export function createState<T = unknown>(): State<T | undefined>
export function createState<T = unknown>(initialValue: MayFn<T>): State<T>
export function createState<T = unknown>(initialValue?: MayFn<T>): State<any> {
  const [solidjsAccessor, solidjsSetSignal] = createSignal(shrinkFn(initialValue)) // 这里不应该使用跟随，不然的话语义就不对了
  const thisState: State = {
    read() {
      return solidjsAccessor()
    },
    [readableStateBrand]: true,
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
      return mapState(thisState, toNew)
    },
  }

  // 注册这个 state，以便于未来的管控
  registeredStateSet.add(thisState)

  return thisState
}

/**
 * 虽然实际上它创建了一个新的state，
 * 但是我觉得在语义上它应该是个read-only statem,
 * 不然的话，它的返回结构不太符合业务直觉。
 *
 * @param source 需要订阅的一个源
 * @param toNew
 * @returns
 */
function mapState<T, U>(source: Source<T>, toNew: (value: T) => Source<U>): ReadableState<U> {
  const mappedState = createState()
  createReactiveRunner(() => {
    const sourceValue = val(source)
    const newValue = val(toNew(sourceValue))
    mappedState.set(newValue)
  })
  return mappedState as State<U>
}

/**
 * 数据源A **跟随** 数据源B的变化
 * @param thisState 数据源A
 * @param followTarget 数据源B
 * @param transform 经过转换默认直接输出
 * @return 函数：取消跟随
 */
export function followState<T, U>(
  thisState: State<T>,
  followTarget: ReadableState<U>,
  transform: (value: U) => T = (v) => v as unknown as T,
): () => void {
  const { dispose: unfollow } = createReactiveRunner(() => {
    const newValue = transform(val(followTarget))
    thisState.set(newValue)
  })
  return unfollow
}

/**
 * 【工具函数】
 * 方便快速把一个值包装成 state，如果已经是 state 就直接返回。
 * 这个函数的设计初衷是为了在业务代码中快速把一个普通值提升成响应式 state，或者在不确定是否已经是 state 的情况下安全地使用它。
 * @example
 * ```ts
 * const count = state(0) // count 是一个 State<number>
 * const doubleCount = count.map(x => x * 2) // doubleCount 是一个 ReadableState<number>，它会自动跟随 count 的变化
 * ```
 */
export function state<T>(sourceOrValue: Accessor<T>): State<T>
export function state<T>(sourceOrValue: State<T>): State<T>
export function state<T>(sourceOrValue: ReadableState<T>): State<T>
export function state<T>(sourceOrValue: Source<T>): State<T>
export function state<T>(sourceOrValue: T): State<T>
export function state<T>(sourceOrValue: T): any {
  if (isState(sourceOrValue)) return sourceOrValue
  if (isReadableState(sourceOrValue)) {
    const newState = createState()
    followState(newState, sourceOrValue)
    return newState
  }
  if (isAccessor(sourceOrValue)) {
    const initialValue = sourceOrValue()
    const newState = createState(initialValue)
    createEffect(
      on(
        sourceOrValue,
        (value) => {
          newState.set(() => value)
        },
        { defer: true },
      ),
    )
    return newState
  }

  // 其他普通值，直接包装成 state
  return createState(sourceOrValue)
}
