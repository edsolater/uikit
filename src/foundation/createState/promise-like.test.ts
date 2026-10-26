/**
 * 本文件验证 PromiseLike 转换产生的 StateView 结算行为。
 * StateView 身份复用由 state-view.test.ts 验证。
 */
import { expect, test } from 'vitest'
import { NotReadyError, resolve } from 'solid-js'
import { toStateViewFromPromiseLike } from './promise-like'

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

test('PromiseLike 转换器不管理 StateView 身份', () => {
  const promise = Promise.resolve(8)

  expect(toStateViewFromPromiseLike(promise)).not.toBe(
    toStateViewFromPromiseLike(promise),
  )
})

test('StateView 从原生 pending 进入 PromiseLike 完成值', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateViewFromPromiseLike(deferred.promise)

  expect(stateView.read).toThrow(NotReadyError)

  deferred.resolve(8)
  await resolve(stateView.read)

  expect(stateView.read()).toBe(8)
})

test('默认 PromiseLike 失败由原生计算传播，不伪装为 undefined', async () => {
  const deferred = createDeferred<number>()
  const view = toStateViewFromPromiseLike(deferred.promise)
  const error = new Error('读取失败')
  const settled = resolve(view.read)
  deferred.reject(error)
  await expect(settled).rejects.toBe(error)
  expect(view.read).toThrow('读取失败')
})

test('完成的 undefined 保持完成值', async () => {
  const request = Promise.withResolvers<undefined>()
  const view = toStateViewFromPromiseLike(request.promise)
  expect(view.read).toThrow(NotReadyError)
  request.resolve(undefined)
  await expect(resolve(view.read)).resolves.toBeUndefined()
  expect(view.read()).toBeUndefined()
})
