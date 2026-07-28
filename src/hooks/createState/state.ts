/**
 * State 领域。
 *
 * 本文件定义可写 State，并负责创建与识别 State。
 * State 建立在 StateView 之上，但不负责 Source 的统一转换。
 */
import { isFunction, isObject, shrinkFn, type MayFn } from '@edsolater/fnkit'
import { createSignal } from 'solid-js'
import { createReactionFn } from './createReactiveRunner'
import { isStateView, stateViewBrand, type StateView } from './state-view'

export const stateBrand = Symbol('State')

export interface State<T = any> extends StateView<T> {
  /** 确定物种是个state，isState 使用 */
  [stateBrand]: true

  /** 新JS语法， 销毁时自动调用 */
  [Symbol.dispose](): void

  /* 虽然返回自身，但实际上只是改变这个state的值，这个state因为它是对象还是这个state */
  set(newValue: T | ((prev: T) => T)): State<T>
}

/**
 * 判断一个值是否是我们创造的 state。
 */
export function isState(value: unknown): value is State {
  return isObject(value) && (value as any)?.[stateBrand] === true
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
        const newValue = toNew(thisState.read())
        mappedState.set(isStateView(newValue) ? newValue.read() : newValue)
      })
      return mappedState as State<any>
    },
  }
  return thisState
}
