import {
  flush,
  resolve,
  NotReadyError,
  until,
  createRoot,
  createEffect,
  createMemo,
} from 'solid-js'
/**
 * 本文件验证 Val 与 val 的最终读取协议。
 * 它不承担 Source 输入类型和 stateView 转换 options 的测试。
 */
import { toPromiseResultProxy } from '@edsolater/fnkit'
import { expect, expectTypeOf, test } from 'vitest'
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
  expectTypeOf<Val<StateView<Promise<number>>>>().toEqualTypeOf<number>()
  expectTypeOf<Val<Promise<StateView<number>>>>().toEqualTypeOf<number>()
})

test('val 在 UIKit 读取边界递归解除内部包装', () => {
  const value = createState(1)
  const nestedSource = createState(value)
  const observedValues: number[] = []
  const { read, dispose } = createRoot((dispose) => ({
    read: createMemo(() => {
      const currentValue = val(nestedSource)
      observedValues.push(currentValue)
      return currentValue
    }),
    dispose,
  }))

  expectTypeOf(val(nestedSource)).toEqualTypeOf<number>()
  expect(read()).toBe(1)
  expect(observedValues).toEqual([1])

  value.set(2)
  flush()

  expect(read()).toBe(2)
  expect(observedValues).toEqual([1, 2])
  dispose()
})

test('val 在 PromiseLike 完成前保留原生 pending', () => {
  const source = Promise.resolve(8)

  expectTypeOf(val(1)).toEqualTypeOf<1>()
  expectTypeOf(val(createState(1))).toEqualTypeOf<number>()
  expectTypeOf(() => val(source)).returns.toEqualTypeOf<number>()
  expect(() => val(source)).toThrow(NotReadyError)
})

test('PromiseLike 完成后更新 StateView 并重新运行响应式消费', async () => {
  const deferred = createDeferred<number>()
  const observedValues: (number | undefined)[] = []
  const { read, dispose } = createRoot((dispose) => ({
    read: createMemo(() => {
      const value = val(deferred.promise)
      observedValues.push(value)
      return value
    }),
    dispose,
  }))

  expect(read).toThrow(NotReadyError)
  expect(observedValues).toEqual([])

  deferred.resolve(8)
  await until(() => read() === 8)

  expect(read()).toBe(8)
  expect(observedValues).toEqual([8])
  dispose()
})

test('val 的默认值不截获 PromiseLike 等待，完成后响应式更新', async () => {
  const deferred = createDeferred<number>()
  const observedValues: number[] = []
  const { read, dispose } = createRoot((dispose) => ({
    read: createMemo(() => {
      const value = val(deferred.promise, 0)
      observedValues.push(value)
      return value
    }),
    dispose,
  }))

  expectTypeOf(() => val(deferred.promise, 0)).returns.toEqualTypeOf<number>()
  expectTypeOf(() => val(deferred.promise, 'loading')).returns.toEqualTypeOf<
    number | 'loading'
  >()
  expect(observedValues).toEqual([])
  expect(read).toThrow(NotReadyError)

  deferred.resolve(8)
  await until(() => read() === 8)

  expect(read()).toBe(8)
  expect(observedValues).toEqual([8])
  dispose()
})

test('val 的默认值不截获 PromiseLike 失败', async () => {
  const deferred = createDeferred<number>()
  const error = new Error('读取失败')
  const settled = resolve(() => val(deferred.promise, 0))
  deferred.reject(error)
  await expect(settled).rejects.toBe(error)
  expect(() => val(deferred.promise, 0)).toThrow('读取失败')
})
test('val 继续读取 PromiseLike 完成后取得的 Source', async () => {
  const deferred = createDeferred<Source<number>>()
  const promiseResultProxy = toPromiseResultProxy(
    deferred.promise.then((value) => ({ value })),
  ).value
  const sourceFromProxy: Source<number | undefined> = promiseResultProxy
  const source = createState(2)
  const observedValues: number[] = []
  const { read, dispose } = createRoot((dispose) => ({
    read: createMemo(() => {
      const value = val(promiseResultProxy, 0)
      observedValues.push(value)
      return value
    }),
    dispose,
  }))

  expect(sourceFromProxy).toBe(promiseResultProxy)
  expectTypeOf(() => val(promiseResultProxy, 0)).returns.toEqualTypeOf<number>()
  expect(observedValues).toEqual([])
  expect(read).toThrow(NotReadyError)

  deferred.resolve(source)
  await promiseResultProxy
  await until(() => read() === 2)

  expect(read()).toBe(2)
  expect(observedValues).toEqual([2])

  source.set(4)
  flush()

  expect(read()).toBe(4)
  expect(observedValues).toEqual([2, 4])
  dispose()
})

test('PromiseResultProxy 作为 PromiseLike Source 自动转换为 StateView', async () => {
  const deferred = createDeferred<{ value: number }>()
  const promiseResultProxy = toPromiseResultProxy(deferred.promise)
  const observedValues: ({ value: number } | undefined)[] = []
  const { read, dispose } = createRoot((dispose) => ({
    read: createMemo(() => {
      const value = val(promiseResultProxy)
      observedValues.push(value)
      return value
    }),
    dispose,
  }))

  expect(read).toThrow(NotReadyError)
  expect(observedValues).toEqual([])

  const object = { value: 8 }
  deferred.resolve(object)
  await resolve(read)

  expect(read()).toBe(object)
  expect(observedValues).toEqual([object])
  dispose()
})

test('显式默认值反复消费完成 Promise，不重新退回等待值', async () => {
  const request = Promise.withResolvers<number>()
  const trigger = createState(0)
  const observed: number[][] = []
  const stop = createRoot((dispose) => {
    createEffect(
      () => {
        val(trigger)
        return [val(request.promise, 0), val(request.promise, -1)]
      },
      (values) => {
        observed.push([...values])
      },
    )
    return dispose
  })
  try {
    flush()
    expect(observed).toEqual([])
    request.resolve(8)
    await expect.poll(() => observed.at(-1)).toEqual([8, 8])
    trigger.set(1)
    await expect.poll(() => observed.length).toBe(2)
    expect(observed).toEqual([
      [8, 8],
      [8, 8],
    ])
    expect(val(request.promise, 0)).toBe(8)
  } finally {
    stop()
  }
})

test('默认函数只为空值执行，来源非空后停止订阅默认来源', () => {
  const source = createState<number | null>(null)
  const fallback = createState(0)
  const observed: number[] = []
  let calls = 0
  const stop = createRoot((dispose) => {
    createEffect(
      () =>
        val(source, () => {
          calls++
          return val(fallback)
        }),
      (value) => {
        observed.push(value)
      },
    )
    return dispose
  })
  try {
    flush()
    expect(observed).toEqual([0])
    expect(calls).toBe(1)
    fallback.set(2)
    flush()
    expect(observed).toEqual([0, 2])
    source.set(7)
    flush()
    const completedCalls = calls
    fallback.set(3)
    flush()
    expect(observed).toEqual([0, 2, 7])
    expect(calls).toBe(completedCalls)
  } finally {
    stop()
  }
})
test('完成空值选中的异步默认来源仍由原生计算等待', async () => {
  const request = Promise.withResolvers<null>()
  const fallback = Promise.withResolvers<number>()
  let calls = 0
  const { read, dispose } = createRoot((dispose) => ({
    read: createMemo(() =>
      val(request.promise, () => {
        calls++
        return fallback.promise
      }),
    ),
    dispose,
  }))
  try {
    expect(read).toThrow(NotReadyError)
    expect(calls).toBe(0)
    request.resolve(null)
    await request.promise
    await Promise.resolve()
    expect(read).toThrow(NotReadyError)
    fallback.resolve(3)
    await until(() => read() === 3)
    expect(read()).toBe(3)
  } finally {
    dispose()
  }
})

test('完成空值使用默认函数时，默认函数自己的错误不被重新捕获执行', async () => {
  const source = Promise.resolve(undefined)
  await resolve(() => val(source))
  const error = new Error('默认计算失败')
  let calls = 0
  expect(() =>
    val(source, () => {
      calls++
      throw error
    }),
  ).toThrow(error)
  expect(calls).toBe(1)
})

test('普通空值与包装后的空值统一选用默认值，未提供默认值时保留原值', () => {
  expect(val(null)).toBeNull()
  expect(val(undefined)).toBeUndefined()
  expect(val(null, 4)).toBe(4)
  expect(val(createState(null), 4)).toBe(4)
  expect(val(createState(undefined), () => 5)).toBe(5)
  expect(val(null, null)).toBeNull()
  expect(val(undefined, null)).toBeNull()
  expect(val(undefined, () => null)).toBeNull()
  expect(val(createState(createState(null)), 4)).toBe(4)
})
