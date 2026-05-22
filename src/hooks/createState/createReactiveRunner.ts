import { createComputed, createRoot } from 'solid-js'

export interface ReactiveRunner<T = void> {
  /**
   * 获取最近一次 action 的返回结果。
   *
   * createReactiveRunner 创建时会同步运行一次，
   * 所以创建后通常可以立即读取。
   */
  getResult(): T

  /**
   * 释放这段响应式运行。
   *
   * 释放后：
   * - 后续依赖变化不会再触发 action
   * - getResult() 仍返回最后一次结果
   * - 重复调用 dispose() 无副作用
   */
  dispose(): void

  /** JS 显式资源释放协议 */
  [Symbol.dispose](): void
}

/**
 * 创建一个可释放的响应式 runner。
 *
 * - 创建时同步运行一次
 * - action 中同步读取到的响应式值会成为依赖
 * - 依赖变化后重新运行 action
 * - dispose 后停止后续运行
 */
export function createReactionFn<T>(action: () => T): ReactiveRunner<T> {
  let result!: T
  let disposed = false

  const disposeRoot = createRoot((dispose) => {
    createComputed(() => {
      result = action()
    })

    return dispose
  })

  const dispose = (): void => {
    if (disposed) return

    disposed = true
    disposeRoot()
  }

  return {
    getResult: () => result,
    dispose,
    [Symbol.dispose]: dispose,
  }
}