/**
 * 本文件验证 Source 与 val 的最终读取协议。
 * 它覆盖 PromiseLike 的自动 StateView 转换，不承担手动 PromiseLike 转换配置。
 */
import { toObjectProxy } from '@edsolater/fnkit'
import { expect, expectTypeOf, test } from 'vitest'
import { createReactionFn } from './createReactiveRunner'
import { val } from './read'
import { createState } from './state'
import { toStateView, type Source, type StateView } from './state-view'

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

test('toStateView 的函数参数等价于 options.map', () => {
  const source = createState(2)
  const map = (value: number) => value * 2
  const fromFunction = toStateView(source, map)
  const fromOptions = toStateView(source, { map })

  expectTypeOf(fromFunction).toEqualTypeOf<StateView<number>>()
  expectTypeOf(fromOptions).toEqualTypeOf<StateView<number>>()
  expect(fromFunction.read()).toBe(4)
  expect(fromOptions.read()).toBe(4)

  source.set(3)

  expect(fromFunction.read()).toBe(6)
  expect(fromOptions.read()).toBe(6)
})

test('toStateView 使用 defaultValue 后仍在 fulfilled 时响应式更新', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateView(deferred.promise, { defaultValue: 0 })
  const observedValues: number[] = []
  const runner = createReactionFn(() => {
    const value = val(stateView)
    observedValues.push(value)
    return value
  })

  expectTypeOf(stateView).toEqualTypeOf<StateView<number>>()
  expect(observedValues).toEqual([0])

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(runner.getResult()).toBe(8)
  expect(observedValues).toEqual([0, 8])
  runner.dispose()
})

test('toStateView 在 PromiseLike 转换后应用 options.map', async () => {
  const deferred = createDeferred<number>()
  const stateView = toStateView(deferred.promise, {
    defaultValue: 0,
    map: (value) => `value:${value}`,
  })
  const observedValues: string[] = []
  const runner = createReactionFn(() => {
    const value = val(stateView)
    observedValues.push(value)
    return value
  })

  expectTypeOf(stateView).toEqualTypeOf<StateView<string>>()
  expect(observedValues).toEqual(['value:0'])

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(runner.getResult()).toBe('value:8')
  expect(observedValues).toEqual(['value:0', 'value:8'])
  runner.dispose()
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
  const observedValues: (number | string)[] = []
  const runner = createReactionFn(() => {
    const value = val(stateView)
    observedValues.push(value)
    return value
  })

  expectTypeOf(stateView).toEqualTypeOf<StateView<number | string>>()
  expect(observedValues).toEqual([0])

  deferred.reject(error)
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()

  expect(runner.getResult()).toBe('failed')
  expect(observedValues).toEqual([0, 'failed'])
  expect(rejectedReason).toBe(error)
  runner.dispose()
})

test('ObjectProxy 作为 PromiseLike Source 自动转换为 StateView', async () => {
  const deferred = createDeferred<{ value: number }>()
  const objectProxy = toObjectProxy(deferred.promise)
  const observedValues: ({ value: number } | undefined)[] = []
  const runner = createReactionFn(() => {
    const value = val(objectProxy)
    observedValues.push(value)
    return value
  })

  expect(runner.getResult()).toBeUndefined()
  expect(observedValues).toEqual([undefined])

  const object = { value: 8 }
  deferred.resolve(object)
  await objectProxy
  await Promise.resolve()

  expect(runner.getResult()).toBe(object)
  expect(observedValues).toEqual([undefined, object])
  runner.dispose()
})
