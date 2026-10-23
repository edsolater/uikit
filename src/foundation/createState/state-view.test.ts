import { flush, resolve, NotReadyError, createEffect, until, createMemo, createRoot } from 'solid-js'
/**
 * 本文件验证 stateView 的统一转换、身份复用、映射和 options 分派。
 * PromiseLike 领域自身只验证结算行为。
 */
import { expect, expectTypeOf, test } from 'vitest'

import { val } from './read'
import { createState, isState } from './state'
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
  expectTypeOf(view).toEqualTypeOf<StateView<number>>()
  expect(view.read).toThrow(NotReadyError)

  deferred.resolve(8)
  await resolve(view.read)

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

test('stateView 在 PromiseLike 转换后应用 options.map', async () => {
  const deferred = createDeferred<number>()
  const view = stateView(deferred.promise, {
    map: (value) => `value:${value}`,
  })
  const observedValues: string[] = []
  const { read, dispose } = createRoot(dispose => ({
    read: createMemo(() => {
      const value = val(view)
      observedValues.push(value)
      return value
    }),
    dispose,
  }))

  expectTypeOf(view).toEqualTypeOf<StateView<string>>()
  expect(observedValues).toEqual([])
  expect(read).toThrow(NotReadyError)

  deferred.resolve(8)
  await deferred.promise
  await Promise.resolve()

  expect(read()).toBe('value:8')
  expect(observedValues).toEqual(['value:8'])
  dispose()
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

test('共享 Promise 视图跨 owner 复用，首消费者卸载不终止其他消费者', async () => {
  const request = Promise.withResolvers<number>()
  let first: StateView<number> | undefined
  const stopFirst = createRoot(dispose => {
    first = stateView(request.promise)
    createEffect(first.read, () => {})
    return dispose
  })
  flush()
  stopFirst()
  const values: number[] = []
  const second = createRoot(dispose => {
    const view = stateView(request.promise)
    createEffect(view.read, value => { values.push(value) })
    return { view, dispose }
  })
  try {
    expect(second.view).toBe(first)
    request.resolve(7)
    await expect.poll(() => values).toEqual([7])
    second.dispose()
    for (let index = 0; index < 3; index++) expect(stateView(request.promise).read()).toBe(7)
    const third = createRoot(dispose => ({ view: stateView(request.promise), dispose }))
    try { expect(third.view.read()).toBe(7) } finally { third.dispose() }
  } finally { second.dispose() }
})

test('失败的共享 Promise 在失去全部观察后仍保留原始失败', async () => {
  const request = Promise.withResolvers<number>()
  const view = stateView(request.promise)
  const error = new Error('共享请求失败')
  const outcome = resolve(view.read)
  request.reject(error)
  await expect(outcome).rejects.toBe(error)
  for (let index = 0; index < 3; index++) expect(view.read).toThrow('共享请求失败')
  await expect(resolve(stateView(request.promise).read)).rejects.toBe(error)
})

test('普通值转换只提供读取与映射，保留原值身份', () => {
  const value = { count: 2 }
  const view = stateView(value)
  expectTypeOf(view).toEqualTypeOf<StateView<{ count: number }>>()
  expect(view.read()).toBe(value)
  expect(isState(view)).toBe(false)
  expect('set' in view).toBe(false)
  expect(view.map(value => value.count * 2).read()).toBe(4)
})

test('函数来源缓存计算并跟随依赖，函数结果保持数据，作用域释放停止计算', () => {
  const source = createState(1)
  const handler = () => 7
  let computations = 0
  const scope = createRoot(dispose => ({
    view: stateView(() => { computations++; return val(source) * 2 }),
    handler: stateView(() => handler),
    dispose,
  }))
  try {
    expectTypeOf(scope.view).toEqualTypeOf<StateView<number>>()
    expectTypeOf(scope.handler).toEqualTypeOf<StateView<() => number>>()
    expect(scope.view.read()).toBe(2)
    expect(scope.view.read()).toBe(2)
    expect(computations).toBe(1)
    expect(scope.handler.read()).toBe(handler)
    source.set(3)
    flush()
    expect(scope.view.read()).toBe(6)
    expect(computations).toBe(2)
    scope.dispose()
    source.set(4)
    flush()
    expect(computations).toBe(2)
  } finally { scope.dispose() }
})

test('函数来源展开 Promise 与嵌套 thenable，映射接收完成类型，失败由原生传播', async () => {
  const request = Promise.withResolvers<number>()
  const thenable = { then(deliver: (value: Promise<number>) => unknown) { deliver(request.promise) } }
  const scope = createRoot(dispose => ({
    view: stateView(() => thenable),
    mapped: stateView(() => request.promise, { map(value) {
      expectTypeOf(value).toEqualTypeOf<number>()
      return value * 2
    } }),
    shorthand: stateView(() => request.promise, value => value + 1),
    dispose,
  }))
  try {
    expectTypeOf(scope.view).toEqualTypeOf<StateView<number>>()
    expect(scope.view.read).toThrow(NotReadyError)
    request.resolve(5)
    await Promise.all([resolve(scope.view.read), resolve(scope.mapped.read), resolve(scope.shorthand.read)])
    expect(scope.view.read()).toBe(5)
    expect(scope.mapped.read()).toBe(10)
    expect(scope.shorthand.read()).toBe(6)
  } finally { scope.dispose() }
  const error = new Error('计算来源失败')
  const failure = createRoot(dispose => ({ view: stateView(() => Promise.reject<number>(error)), dispose }))
  try { await expect(resolve(failure.view.read)).rejects.toBe(error) }
  finally { failure.dispose() }
})
