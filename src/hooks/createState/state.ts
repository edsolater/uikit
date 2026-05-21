import { createEffect, createMemo, createSignal, on, type Accessor } from 'solid-js'
import { isFunction, isObject, shrinkFn, type MayFn } from '@edsolater/fnkit'
import type { Source } from './read'

export const readableStateSymbol = Symbol('ReadableState')
export const stateSymbol = Symbol('State')

export interface ReadableState<T = any> {
  /**
   * 唯一的读取自身当前值的入口
   * 写业务时，不直接使用这个方法，因为会产生主语错误，尽量使用 {@link state} 来快将任何值包装成state
   * 这里是底层实现，如，{@link val} 与 {@link mapState} 与 {@link followState}
   */
  read(): T

  /** 确定物种是个 readable state，isReadableState 使用 */
  [readableStateSymbol]: true

  /* 创建一个新的派生 readable state */
  map<U>(toNew: (value: T) => U): ReadableState<U>
}

export interface State<T = any> extends ReadableState<T> {
  /** 确定物种是个state，isState 使用 */
  [stateSymbol]: true

  /** 新JS语法， 销毁时自动调用 */
  [Symbol.dispose](): void

  /* 虽然返回自身，但实际上只是改变这个state的值，这个state因为它是对象还是这个state */
  set(newValue: T | ((prev: T) => T)): State<T>

  /* 订阅另一个可订阅的 state，会直接createEffect响应式订阅 */
  follow(source: ReadableState<T>): State<T>
  follow<U>(source: ReadableState<U>, transform: (value: U) => T): State<T>
}

/**
 * 方便以后统一管控
 */
const registeredStateSet = new WeakSet<State>()

export function isReadableState(value: unknown): value is ReadableState {
  return (
    registeredStateSet.has(value as any) ||
    (isObject(value) && ((value as any)?.[readableStateSymbol] === true || (value as any)?.[stateSymbol] === true))
  )
}

/**
 * 判断一个值是否是我们创造的 state。
 * 在管理用的 createState中使用
 */
export function isState(value: unknown): value is State {
  return registeredStateSet.has(value as any) || (isObject(value) && (value as any)?.[stateSymbol] === true)
}

function isAccessor<T>(value: unknown): value is Accessor<T> {
  return isFunction(value) && value.length === 0
}

/**
 * 创建一个新的 state。
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
  const [solidjsAccessor, solidjsSetSignal] = createSignal(shrinkFn(initialValue))
  const thisState: State = {
    read() {
      return solidjsAccessor()
    },
    [readableStateSymbol]: true,
    [stateSymbol]: true,
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
    //@ts-expect-error 此处TS自动推断类型有问题，实际上是支持两种重载的。
    follow(source, transform) {
      followState(thisState, source, transform ?? ((x) => x as any))
      return thisState
    },
  }

  // 注册这个 state，以便于未来的管控
  registeredStateSet.add(thisState)

  return thisState
}

function mapState<T, U>(source: ReadableState<T>, toNew: (value: T) => U): ReadableState<U> {
  const mappedState = state(createMemo(() => toNew(source.read())))
  return mappedState
}

function followState<T, U>(thisState: State<T>, source: ReadableState<U>, transform: (value: U) => T): void {
  createEffect(() => {
    const value = source.read()
    const newValue = transform(value)
    thisState.set(newValue)
  })
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
    return createState(sourceOrValue.read()).follow(sourceOrValue)
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
