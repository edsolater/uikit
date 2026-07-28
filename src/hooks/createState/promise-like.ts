/**
 * PromiseLike 的 StateView 转换领域。
 *
 * 本文件负责识别 PromiseLike，并将 fulfilled、pending 与 rejected 三条路径转换成 StateView。
 * 它不限定 StateView 的使用周期，也不负责最终读取。
 */
import { hasProperty, isFunction } from '@edsolater/fnkit'
import { createState } from './state'
import type { StateView } from './state-view'

export type PromiseLikeStateViewOptions<D, E = D> = {
  /** pending 阶段写入 StateView 的值。 */
  defaultValue: D

  /** rejected 阶段写入 StateView 的值；未提供时使用 defaultValue。 */
  errorValue?: E

  /** rejected 时接收原始 reason。 */
  onRejected?(reason: unknown): void
}

/**
 * 判断未知值是否实现 PromiseLike 的 thenable 协议。
 *
 * 直接依赖 fnkit 的 `hasProperty()` 与 `isFunction()`；业务对象一旦公开可调用的 `then`，即视为 PromiseLike。
 */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return hasProperty(value, 'then') && isFunction(value.then)
}

/**
 * 将 PromiseLike 转换为 StateView。
 *
 * 未提供配置时，pending 与 rejected 阶段使用 undefined。
 * 提供配置时，pending 使用 defaultValue；rejected 优先使用 errorValue，并调用 onRejected。
 *
 * 直接依赖 UIKit 的 `createState()` 承载 Solid signal，并使用原生 Promise 统一展开 thenable。
 */
export function toStateViewFromPromiseLike<V>(
  promiseLike: PromiseLike<V>,
): StateView<Awaited<V> | undefined>
export function toStateViewFromPromiseLike<V, D, E>(
  promiseLike: PromiseLike<V>,
  options: PromiseLikeStateViewOptions<D, E> & { errorValue: E },
): StateView<Awaited<V> | D | E>
export function toStateViewFromPromiseLike<V, D>(
  promiseLike: PromiseLike<V>,
  options: PromiseLikeStateViewOptions<D>,
): StateView<Awaited<V> | D>
export function toStateViewFromPromiseLike<V, D, E>(
  promiseLike: PromiseLike<V>,
  options?: PromiseLikeStateViewOptions<D, E>,
): StateView<Awaited<V> | D | E | undefined> {
  if (!options) {
    const stateView = createState<Awaited<V> | undefined>()
    void Promise.resolve(promiseLike).then(
      (value) => stateView.set(() => value),
      () => stateView.set(undefined),
    )

    return stateView
  }

  const defaultValue = options.defaultValue
  const errorValue = ('errorValue' in options ? options.errorValue : defaultValue) as D | E
  const stateView = createState<Awaited<V> | D | E>(() => defaultValue)

  void Promise.resolve(promiseLike).then(
    (value) => stateView.set(() => value),
    (reason) => {
      stateView.set(() => errorValue)
      options.onRejected?.(reason)
    },
  )

  return stateView
}
