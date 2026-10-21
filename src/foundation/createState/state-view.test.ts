import { flush, resolve } from 'solid-js'
/**
 * 本文件验证 stateView 的统一转换、身份复用、映射和 options 分派。
 * PromiseLike 领域自身只验证结算行为。
 */
import { expect, expectTypeOf, test } from 'vitest'
import { createRoot } from 'solid-js'
import { createReactionFn } from './createReactiveRunner'
import { val } from './read'
import { createState } from './state'
import { stateView, type StateView } from './state-view'

interface Deferred<V> {
  promise: Promise<V>
  resolve(value: V): void
  reject(reason: unknown): void
}

/** 创建由测试主动结算的 Promise。 */
function createDeferred<V>(): Deferred<V> {
  let resolve!: (value: V) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<V>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

test('stateView 按来源身份复用默认 StateView', async () => {
  const deferred = createDeferred<number>()
  const view = stateView(deferred.promise)

  expect(stateView(deferred.promise)).toBe(view)
  expectTypeOf(view).toEqualTypeOf<StateView<number | undefined>>()
  expect(view.read()).toBeUndefined()

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(view.read()).toBe(8)
})

test('stateView 的函数参数等价于 options.map', () => {
  let initializationCount = 0
  const source = createState(() => {
    initializationCount += 1
    return 2
  })
  const map = (value: number) => value * 2
  const fromFunction = stateView(source, map)
  const fromOptions = stateView(source, { map })

  expectTypeOf(fromFunction).toEqualTypeOf<StateView<number>>()
  expectTypeOf(fromOptions).toEqualTypeOf<StateView<number>>()
  expect(fromFunction.read()).toBe(4)
  expect(fromOptions.read()).toBe(4)

  source.set(3)
  flush()

  expect(fromFunction.read()).toBe(6)
  expect(fromOptions.read()).toBe(6)
  expect(initializationCount).toBe(1)
})

test('映射视图复用当前结果，切换分支后跟随新来源，并随所属作用域释放', () => {
  const source = createState(true)
  const first = createState(2)
  const second = createState(5)
  let mappingCount = 0
  const { view, dispose } = createRoot((dispose) => {
    const view = source.map((enabled) => {
      mappingCount += 1
      return enabled ? first : second
    }).map((value) => value * 2)
    return { view, dispose }
  })

  expect(val(view)).toBe(4)
  const initialCount = mappingCount
  expect(val(view)).toBe(4)
  expect(mappingCount).toBe(initialCount)

  first.set(3)
  flush()
  expect(val(view)).toBe(6)
  source.set(false)
  flush()
  expect(val(view)).toBe(10)
  const switchedCount = mappingCount
  first.set(8)
  flush()
  expect(val(view)).toBe(10)
  expect(mappingCount).toBe(switchedCount)
  second.set(7)
  flush()
  expect(val(view)).toBe(14)

  dispose()
  const disposedCount = mappingCount
  source.set(true)
  flush()
  second.set(9)
  flush()
  expect(mappingCount).toBe(disposedCount)
})

test('stateView 使用 defaultValue 后仍在 fulfilled 时响应式更新', async () => {
  const deferred = createDeferred<number>()
  const view = stateView(deferred.promise, { defaultValue: 0 })
  const observedValues: number[] = []
  const runner = createReactionFn(() => {
    const value = val(view)
    observedValues.push(value)
    return value
  })

  expectTypeOf(view).toEqualTypeOf<StateView<number>>()
  expect(observedValues).toEqual([0])

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(runner.getResult()).toBe(8)
  expect(observedValues).toEqual([0, 8])
  runner.dispose()
})

test('stateView 在 PromiseLike 转换后应用 options.map', async () => {
  const deferred = createDeferred<number>()
  const view = stateView(deferred.promise, {
    defaultValue: 0,
    map: (value) => `value:${value}`,
  })
  const observedValues: string[] = []
  const runner = createReactionFn(() => {
    const value = val(view)
    observedValues.push(value)
    return value
  })

  expectTypeOf(view).toEqualTypeOf<StateView<string>>()
  expect(observedValues).toEqual(['value:0'])

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(runner.getResult()).toBe('value:8')
  expect(observedValues).toEqual(['value:0', 'value:8'])
  runner.dispose()
})

test('stateView 使用 errorValue 与 onRejected 定义 rejected 路径', async () => {
  const deferred = createDeferred<number>()
  const error = new Error('load failed')
  let rejectedReason: unknown
  const view = stateView(deferred.promise, {
    defaultValue: 0,
    errorValue: 'failed',
    onRejected(reason) {
      rejectedReason = reason
    },
  })
  const observedValues: (number | string)[] = []
  const runner = createReactionFn(() => {
    const value = val(view)
    observedValues.push(value)
    return value
  })

  expectTypeOf(view).toEqualTypeOf<StateView<number | string>>()
  expect(observedValues).toEqual([0])

  deferred.reject(error)
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()

  expect(runner.getResult()).toBe('failed')
  expect(observedValues).toEqual([0, 'failed'])
  expect(rejectedReason).toBe(error)
  runner.dispose()
})


test('转换入口的映射选项与函数简写均输出异步完成类型', async () => {
  const scope = createRoot(dispose => ({
    option: stateView(createState(2), { map: value => Promise.resolve(value + 1) }),
    shorthand: stateView(createState(2), value => Promise.resolve(value * 2)),
    dispose,
  }))
  try {
    expectTypeOf(scope.option).toEqualTypeOf<StateView<number>>()
    expectTypeOf(scope.shorthand).toEqualTypeOf<StateView<number>>()
    await Promise.all([resolve(scope.option.read), resolve(scope.shorthand.read)])
    expect(scope.option.read()).toBe(3)
    expect(scope.shorthand.read()).toBe(4)
  } finally { scope.dispose() }
})
