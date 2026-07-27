/**
 * 本文件验证 PromiseLike 转换产生的 StateView 身份与结算行为。
 * 它不测试 val 的最终读取规则。
 */
import { expect, expectTypeOf, test } from 'vitest'
import { toStateViewFromPromiseLike } from './promise-like'
import type { StateView } from './state'

interface Deferred<V> {
  promise: Promise<V>
  resolve(value: V): void
  reject(reason: unknown): void
}

/**
 * 创建由测试主动结算的 Promise。
 */
function createDeferred<V>(): Deferred<V> {
  let resolve!: (value: V) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<V>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

test('同一个 PromiseLike 始终转换为同一个 StateView', () => {
  const promise = Promise.resolve(8)

  expect(toStateViewFromPromiseLike(promise)).toBe(toStateViewFromPromiseLike(promise))
})

test('StateView 从 undefined 更新为 PromiseLike 的完成值', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateViewFromPromiseLike(deferred.promise)

  expect(stateView.read()).toBeUndefined()

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(stateView.read()).toBe(8)
})

test('PromiseLike 失败后 StateView 保持 undefined', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateViewFromPromiseLike(deferred.promise)

  deferred.reject(new Error('load failed'))
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()

  expect(stateView.read()).toBeUndefined()
})

test('未提供 errorValue 时，rejected 使用 defaultValue 并触发 onRejected', async () => {
  const deferred = createDeferred<number>()
  const error = new Error('load failed')
  let rejectedReason: unknown
  const stateView = toStateViewFromPromiseLike(deferred.promise, {
    defaultValue: 0,
    onRejected(reason) {
      rejectedReason = reason
    },
  })

  expectTypeOf(stateView).toEqualTypeOf<StateView<number>>()
  expect(stateView.read()).toBe(0)

  deferred.reject(error)
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()

  expect(stateView.read()).toBe(0)
  expect(rejectedReason).toBe(error)
})

test('errorValue 单独定义 rejected 阶段的状态值', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateViewFromPromiseLike(deferred.promise, {
    defaultValue: 0,
    errorValue: 'failed',
  })

  expectTypeOf(stateView).toEqualTypeOf<StateView<number | string>>()
  expect(stateView.read()).toBe(0)

  deferred.reject(new Error('load failed'))
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()

  expect(stateView.read()).toBe('failed')
})
