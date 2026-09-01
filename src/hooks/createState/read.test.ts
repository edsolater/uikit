/**
 * 本文件验证 Val 与 val 的最终读取协议。
 * 它不承担 Source 输入类型和 toStateView 转换 options 的测试。
 */
import { toPromiseResultProxy } from '@edsolater/fnkit'
import { expect, expectTypeOf, test } from 'vitest'
import { createReactionFn } from './createReactiveRunner'
import { val, type Val } from './read'
import type { Source } from './source'
import { createState } from './state'
import type { StateView } from './state-view'

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

test('val 保留普通值本身', () => {
  const numberArray = [1, 2]
  const objectArray = [{ id: 'first' }]
  const object = { id: 'first' }

  expectTypeOf(val(numberArray)).toEqualTypeOf<number[]>()
  expectTypeOf(val(objectArray)).toEqualTypeOf<{ id: string }[]>()
  expectTypeOf(val(object)).toEqualTypeOf<{ id: string }>()
  expect(val(numberArray)).toEqual([1, 2])
  expect(val(objectArray)).toEqual([{ id: 'first' }])
  expect(val(object)).toEqual({ id: 'first' })
})

test('Val 递归解除 StateView 与 PromiseLike 包装', () => {
  expectTypeOf<Val<StateView<StateView<number>>>>().toEqualTypeOf<number>()
  expectTypeOf<Val<StateView<Promise<number>>>>().toEqualTypeOf<number | undefined>()
  expectTypeOf<Val<Promise<StateView<number>>>>().toEqualTypeOf<number | undefined>()
})

test('val 在 UIKit 读取边界递归解除内部包装', () => {
  const value = createState(1)
  const nestedSource = createState(value)
  const observedValues: number[] = []
  const runner = createReactionFn(() => {
    const currentValue = val(nestedSource)
    observedValues.push(currentValue)
    return currentValue
  })

  expectTypeOf(val(nestedSource)).toEqualTypeOf<number>()
  expect(runner.getResult()).toBe(1)
  expect(observedValues).toEqual([1])

  value.set(2)

  expect(runner.getResult()).toBe(2)
  expect(observedValues).toEqual([1, 2])
  runner.dispose()
})

test('val 在 PromiseLike 完成前返回 undefined', () => {
  const source = Promise.resolve(8)

  expectTypeOf(val(1)).toEqualTypeOf<1>()
  expectTypeOf(val(createState(1))).toEqualTypeOf<number>()
  expectTypeOf(val(source)).toEqualTypeOf<number | undefined>()
  expect(val(source)).toBeUndefined()
})

test('PromiseLike 完成后更新 StateView 并重新运行响应式消费', async () => {
  const deferred = createDeferred<number>()
  const observedValues: (number | undefined)[] = []
  const runner = createReactionFn(() => {
    const value = val(deferred.promise)
    observedValues.push(value)
    return value
  })

  expect(runner.getResult()).toBeUndefined()
  expect(observedValues).toEqual([undefined])

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(runner.getResult()).toBe(8)
  expect(observedValues).toEqual([undefined, 8])
  runner.dispose()
})

test('val 使用 defaultValue 读取 PromiseLike 并响应式更新', async () => {
  const deferred = createDeferred<number>()
  const observedValues: number[] = []
  const runner = createReactionFn(() => {
    const value = val(deferred.promise, 0)
    observedValues.push(value)
    return value
  })

  expectTypeOf(val(deferred.promise, 0)).toEqualTypeOf<number>()
  expectTypeOf(val(deferred.promise, 'loading')).toEqualTypeOf<number | string>()
  expect(observedValues).toEqual([0])

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(runner.getResult()).toBe(8)
  expect(observedValues).toEqual([0, 8])
  runner.dispose()
})

test('val 在 PromiseLike rejected 时继续读取 defaultValue', async () => {
  const deferred = createDeferred<number>()
  const observedValues: number[] = []
  const runner = createReactionFn(() => {
    const value = val(deferred.promise, 0)
    observedValues.push(value)
    return value
  })

  expect(observedValues).toEqual([0])

  deferred.reject(new Error('load failed'))
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()

  expect(runner.getResult()).toBe(0)
  runner.dispose()
})

test('val 继续读取 PromiseLike 完成后取得的 Source', async () => {
  const deferred = createDeferred<Source<number>>()
  const promiseResultProxy = toPromiseResultProxy(
    deferred.promise.then((value) => ({ value })),
  ).value
  const sourceFromProxy: Source<number | undefined> = promiseResultProxy
  const source = createState(2)
  const observedValues: number[] = []
  const runner = createReactionFn(() => {
    const value = val(promiseResultProxy, 0)
    observedValues.push(value)
    return value
  })

  expect(sourceFromProxy).toBe(promiseResultProxy)
  expectTypeOf(val(promiseResultProxy, 0)).toEqualTypeOf<number>()
  expect(observedValues).toEqual([0])

  deferred.resolve(source)
  await promiseResultProxy
  await Promise.resolve()

  expect(runner.getResult()).toBe(2)
  expect(observedValues).toEqual([0, 2])

  source.set(4)

  expect(runner.getResult()).toBe(4)
  expect(observedValues).toEqual([0, 2, 4])
  runner.dispose()
})

test('PromiseResultProxy 作为 PromiseLike Source 自动转换为 StateView', async () => {
  const deferred = createDeferred<{ value: number }>()
  const promiseResultProxy = toPromiseResultProxy(deferred.promise)
  const observedValues: ({ value: number } | undefined)[] = []
  const runner = createReactionFn(() => {
    const value = val(promiseResultProxy)
    observedValues.push(value)
    return value
  })

  expect(runner.getResult()).toBeUndefined()
  expect(observedValues).toEqual([undefined])

  const object = { value: 8 }
  deferred.resolve(object)
  await promiseResultProxy
  await Promise.resolve()

  expect(runner.getResult()).toBe(object)
  expect(observedValues).toEqual([undefined, object])
  runner.dispose()
})
