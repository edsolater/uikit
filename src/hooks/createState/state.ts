import { createEffect, createMemo, createSignal, on, type Accessor } from 'solid-js'
import { isFunction, isObject } from '@edsolater/fnkit'

const stateSymbol = Symbol('State')

export interface State<T = any> {
  /**
   * 唯一的读取自身当前值的入口
   * 写业务时，不直接使用这个方法，因为会产生主语错误，尽量使用 {@link state} 来快将任何值包装成state
   * 这里是底层实现，如，{@link val} 与 {@link mapState} 与 {@link followState}
   */
  read(): T

  /** 确定物种是个state，isState 使用 */
  [stateSymbol]: true

  /** 新JS语法， 销毁时自动调用 */
  [Symbol.dispose](): void

  /* 虽然返回自身，但实际上只是改变这个state的值，这个state因为它是对象还是这个state */
  set(newValue: T | ((prev: T) => T)): State<T>

  /* 创建一个新state，并订阅原state */
  map<U>(toNew: (value: T) => U): State<U>

  /* 订阅另一个可订阅的 state，会直接createEffect响应式订阅 */
  follow(anotherState: State<T>): State<T>
  follow<U>(anotherState: State<U>, transform: (value: U) => T): State<T>
}

/**
 * 方便以后统一管控
 */
const registeredStateSet = new WeakSet<State>()

/**
 * 判断一个值是否是我们创造的 state。
 * 在管理用的 createState中使用
 */
export function isState(mayState: unknown): mayState is State {
  return registeredStateSet.has(mayState as any) || (isObject(mayState) && (mayState as any)?.[stateSymbol] === true)
}

function isAccessor<T>(value: unknown): value is Accessor<T> {
  return isFunction(value) && value.length === 0
}

export function createState<T = unknown>(initialValue: T): State<T> {
  const [solidjsAccessor, solidjsSetSignal] = createSignal(initialValue)
  const thisState: State<T> = {
    read() {
      return solidjsAccessor()
    },
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
    follow(anotherState, transform) {
      followState(thisState, anotherState, transform ?? ((x) => x as any))
      return thisState
    },
  }

  // 注册这个 state，以便于未来的管控
  registeredStateSet.add(thisState)

  return thisState
}

function mapState<T, U>(source: State<T>, toNew: (value: T) => U): State<U> {
  const mappedState = state(createMemo(() => toNew(source.read())))
  return mappedState
}

function followState<T, U>(thisState: State<T>, anotherState: State<U>, transform: (value: U) => T): void {
  createEffect(() => {
    const value = anotherState.read()
    const newValue = transform(value)
    thisState.set(newValue)
  })
}

/**  * 方便快速把一个值包装成 state，如果已经是 state 就直接返回。
 * 这个函数的设计初衷是为了在业务代码中快速把一个普通值提升成响应式 state，或者在不确定是否已经是 state 的情况下安全地使用它。
 * @example
 * ```ts
 * const count = state(0) // count 是一个 State<number>
 * const doubleCount = count.map(x => x * 2) // doubleCount 是一个 State<number>，它会自动跟随 count 的变化
 * ```
 */
export function state<T>(mayState: Accessor<T>): State<T>
export function state<T>(mayState: State<T>): State<T>
export function state<T>(mayState: T): State<T>
export function state<T>(mayState: T): any {
  if (isState(mayState)) return mayState
  if (isAccessor(mayState)) {
    const initialValue = mayState()
    const newState = createState(initialValue)
    createEffect(
      on(
        mayState,
        (value) => {
          newState.set(() => value)
        },
        { defer: true },
      ),
    )
    return newState
  }

  // 其他普通值，直接包装成 state
  return createState(mayState)
}
