/**
 * State 领域。
 *
 * 本文件定义可写 State，并负责创建与识别 State。
 * State 建立在 StateView 之上，但不负责 Source 的统一转换。
 */
import { hasProperty, isTrue } from '@edsolater/fnkit'
import { createMemo } from 'solid-js'
import { isStateView, stateViewBrand, type StateView } from './state-view'
import { isPromiseLike } from './promise-like'
import type { Val } from './read'
import {
  createAsyncSignal,
  type AsyncSignalOptions,
  type StateSource,
  type StateUpdate,
} from './createAsyncSignal'

export const stateBrand = Symbol('State')

export interface State<T = any> extends StateView<T> {
  /** 确定物种是个state，isState 使用 */
  [stateBrand]: true

  /* 虽然返回自身，但实际上只是改变这个state的值，这个state因为它是对象还是这个state */
  set(newValue: StateUpdate<T>): State<T>
}

/**
 * 判断一个值是否是我们创造的 state。
 */
export function isState(value: unknown): value is State {
  return hasProperty(value, stateBrand, isTrue)
}

/**
 * 从完整来源创建可写值状态，直接接收普通值、PromiseLike、State、StateView 及计算来源。
 * StateView 来源参与持续派生，Promise 完成后继续读取其中的来源；调用方不必先用 val 解包。
 * 写入只改变当前状态，不回写上游；后续上游变化继续驱动计算来源。
 * 相对更新基于已有当前值，已有 Promise 由基础层接续；计算来源尚无初值时不预存更新命令。
 * @example
 * function Component() {
 *   const count = createState(0) // count 是一个 State<number>
 *   return <div>{val(count)}</div>
 * }
 * @example
 * const outside = createState(false)
 * const inside = createState(outside) // State<boolean>，不需要 () => val(outside)
 * inside.set(true) // 不回写 outside
 */
export function createState<T = unknown>(): State<Val<T> | undefined>
export function createState<T>(
  initialValue: StateSource<T>,
  options?: AsyncSignalOptions<Val<T>>,
): State<Val<T>>
export function createState(
  initialValue?: any,
  options?: AsyncSignalOptions<any>,
): State<any> {
  const [solidjsAccessor, solidjsSetSignal] = createAsyncSignal(
    initialValue,
    options,
  )

  const thisState: State = {
    read: solidjsAccessor,
    [stateViewBrand]: true,
    [stateBrand]: true,
    set(newValue) {
      solidjsSetSignal(newValue)
      return thisState
    },
    map(toNew) {
      return mapStateView(thisState, toNew)
    },
  }
  return thisState
}

/**
 * 创建缓存当前映射结果的 StateView，映射返回的 StateView 会继续跟随其当前值。
 * 派生视图属于创建时的响应式作用域，作用域释放后停止跟随依赖。
 */
export function mapStateView<T, U>(
  view: StateView<T>,
  mapper: (value: T) => U | StateView<U>,
): StateView<Awaited<U>> {
  const read = createMemo<U>(() => {
    const mapped = mapper(view.read())
    const result = isStateView(mapped) ? mapped.read() : mapped
    // 直接交给计算节点等待；标准 Promise 吸收 thenable 的嵌套结果。
    return isPromiseLike(result) ? Promise.resolve(result) : result
  })
  const mappedView: StateView<any> = {
    read,
    [stateViewBrand]: true,
    map(toNew) {
      return mapStateView(mappedView, toNew)
    },
  }
  return mappedView
}
