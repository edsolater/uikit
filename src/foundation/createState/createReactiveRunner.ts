/** 独立计算与可选动作的生命周期；结果读取直接接入 Solid 的异步计算。 */
import { createMemo, createRoot, runWithOwner } from 'solid-js'
import { createEffect } from '../createEffect'
import { isPromiseLike } from './promise-like'

export interface ReactiveRunner<T = void> {
  /** 读取当前完成值；pending 和失败由 Solid 传播。 */
  getResult(): T
  /** 停止后续跟随，保留最后完成的结果；可以重复释放。 */
  dispose(): void
  [Symbol.dispose](): void
}

/** 计算跟踪依赖，动作在提交后执行；独立 runner 需要显式释放。 */
export function createReactionFn<T>(
  compute: () => T,
  action?: (value: Awaited<T>) => void | (() => void),
): ReactiveRunner<Awaited<T>>
export function createReactionFn<T>(
  compute: () => T,
  action?: (value: T) => void | (() => void),
): ReactiveRunner<T> {
  return runWithOwner(null, () => createRoot(dispose => {
    const read = createMemo<T>(() => {
      const result = compute()
      return isPromiseLike(result) ? Promise.resolve(result) : result
    })
    if (action) createEffect(read, action)
    return { getResult: read, dispose, [Symbol.dispose]: dispose }
  }))
}
