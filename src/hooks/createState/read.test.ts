/**
 * 本文件验证 Source 与 val 的最终读取协议。
 * 它覆盖 PromiseLike 的自动 StateView 转换，不承担手动 PromiseLike 转换配置。
 */
import { toObjectProxy } from '@edsolater/fnkit'
import { expect, expectTypeOf, test } from 'vitest'
import { createReactionFn } from './createReactiveRunner'
import { val, type Source } from './read'
import { createState, toStateView, type StateView } from './state'

interface Deferred<V> {
  promise: Promise<V>
  resolve(value: V): void
  reject(reason: unknown): void
}

/**
 * 创建由测试主动完成的 Promise。
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

test('Source 接受 PromiseLike，val 在完成前返回 undefined', () => {
  const source: Source<number | undefined> = Promise.resolve(8)

  expectTypeOf(val(1)).toEqualTypeOf<number>()
  expectTypeOf(val(createState(1))).toEqualTypeOf<number>()
  expectTypeOf(val(source)).toEqualTypeOf<number | undefined>()
  expectTypeOf<Promise<number>>().not.toMatchTypeOf<Source<number>>()
  expectTypeOf<Promise<number>>().toMatchTypeOf<Source<number | undefined>>()
  expect(val(source)).toBeUndefined()
})

test('PromiseLike 完成后更新 StateView 并重新运行响应式消费', async () => {
  const deferred = createDeferred<number>()
  const runner = createReactionFn(() => val(deferred.promise))

  expect(runner.getResult()).toBeUndefined()

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(runner.getResult()).toBe(8)
  runner.dispose()
})

test('toStateView 复用 PromiseLike 自动对应的 StateView', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateView(deferred.promise)

  expectTypeOf(stateView).toEqualTypeOf<StateView<number | undefined>>()
  expect(stateView.read()).toBeUndefined()

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(stateView.read()).toBe(8)
})

test('toStateView 使用 defaultValue 定义 PromiseLike 的 pending 与 rejected 类型', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateView(deferred.promise, { defaultValue: 0 })

  expectTypeOf(stateView).toEqualTypeOf<StateView<number>>()
  expect(stateView.read()).toBe(0)

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(stateView.read()).toBe(8)
})

test('toStateView 使用 errorValue 与 onRejected 定义 rejected 路径', async () => {
  const deferred = createDeferred<number>()
  const error = new Error('load failed')
  let rejectedReason: unknown
  const stateView = toStateView(deferred.promise, {
    defaultValue: 0,
    errorValue: 'failed',
    onRejected(reason) {
      rejectedReason = reason
    },
  })

  expectTypeOf(stateView).toEqualTypeOf<StateView<number | string>>()
  expect(stateView.read()).toBe(0)

  deferred.reject(error)
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()

  expect(stateView.read()).toBe('failed')
  expect(rejectedReason).toBe(error)
})

test('ObjectProxy 作为 PromiseLike Source 自动转换为 StateView', async () => {
  const deferred = createDeferred<{ value: number }>()
  const objectProxy = toObjectProxy(deferred.promise)
  const runner = createReactionFn(() => val(objectProxy))

  expect(runner.getResult()).toBeUndefined()

  const object = { value: 8 }
  deferred.resolve(object)
  await objectProxy
  await Promise.resolve()

  expect(runner.getResult()).toBe(object)
  runner.dispose()
})
