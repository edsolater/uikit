/** 验证 State 的统一异步读写、函数值与派生生命周期。 */
import { createRoot, flush, resolve, until } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createEffect } from '../createEffect'
import { createState, type State } from './state'

test('无依赖初始化只执行一次，函数值保持身份，写入随 Solid 提交', () => {
  let initialized = 0
  const fn = () => 7
  const value = createState(() => {
    initialized += 1
    return fn
  })
  expect(initialized).toBe(1)
  expect(value.read()).toBe(fn)
  const next = () => 9
  value.set(() => next)
  flush()
  expect(value.read()).toBe(next)
  expect(initialized).toBe(1)
  const number = createState(1)
  number.set(previous => previous + 1)
  flush()
  expect(number.read()).toBe(2)
})

test('State 以完成类型声明，初始与后续异步输入不要求业务解包', async () => {
  const initial = Promise.withResolvers<number>()
  const next = Promise.withResolvers<number>()
  const scope = createRoot(dispose => ({ state: createState(initial.promise), dispose }))
  try {
    expectTypeOf(scope.state).toEqualTypeOf<State<number>>()
    scope.state.set(value => value + 1)
    initial.resolve(2)
    expect(await resolve(() => scope.state.read())).toBe(3)
    expect(scope.state.set(next.promise)).toBe(scope.state)
    scope.state.set(value => Promise.resolve(value * 2))
    const settled = until(() => scope.state.read() === 10)
    next.resolve(5)
    await settled
    expect(scope.state.read()).toBe(10)
  } finally { scope.dispose() }
})

test('显式 Promise 泛型的读取、更新及选项均使用完成类型', async () => {
  const deferred = Promise.withResolvers<number>()
  const received: number[] = []
  const comparisons: number[][] = []
  const scope = createRoot(dispose => ({
    state: createState<Promise<number>>(deferred.promise, {
      loadingValue: 0,
      equals(previous, next) {
        expectTypeOf(previous).toEqualTypeOf<number>()
        expectTypeOf(next).toEqualTypeOf<number>()
        comparisons.push([previous, next])
        return previous === next
      },
    }),
    dispose,
  }))
  try {
    expectTypeOf(scope.state).toEqualTypeOf<State<number>>()
    expect(scope.state.read()).toBe(0)
    scope.state.set(previous => {
      expectTypeOf(previous).toEqualTypeOf<number>()
      received.push(previous)
      return previous + 1
    })
    deferred.resolve(5)
    await until(() => scope.state.read() === 6)
    expect(scope.state.read()).toBe(6)
    expect(received).toEqual([5])
    expect(comparisons.flat().every(value => typeof value === 'number')).toBe(true)
    scope.state.set(8)
    await until(() => scope.state.read() === 8)
    expect(scope.state.read()).toBe(8)
  } finally { scope.dispose() }
})

test('PromiseLike 与嵌套 Promise 泛型读取原生展开后的结果', async () => {
  const promise = Promise.resolve(7)
  const thenable: PromiseLike<number> = { then: promise.then.bind(promise) }
  const nested = new Promise<PromiseLike<number>>(resolve => resolve(thenable))
  const scope = createRoot(dispose => ({
    thenable: createState<PromiseLike<number>>(thenable),
    nested: createState<Promise<PromiseLike<number>>>(nested),
    computed: createState<Promise<number>>(() => Promise.resolve(9)),
    dispose,
  }))
  try {
    expectTypeOf(scope.thenable).toEqualTypeOf<State<number>>()
    expectTypeOf(scope.nested).toEqualTypeOf<State<number>>()
    expectTypeOf(scope.computed).toEqualTypeOf<State<number>>()
    expect(thenable).not.toBeInstanceOf(Promise)
    await Promise.all([
      resolve(scope.thenable.read), resolve(scope.nested.read), resolve(scope.computed.read),
    ])
    expect(scope.thenable.read()).toBe(7)
    expect(scope.nested.read()).toBe(7)
    expect(scope.computed.read()).toBe(9)
  } finally { scope.dispose() }
})

test('相同派生值不重复触发消费者动作，作用域退出后停止通知', () => {
  const source = createState(1)
  const actions: number[] = []
  const dispose = createRoot(dispose => {
    const parity = source.map(value => value % 2)
    createEffect(parity, value => { actions.push(value) })
    return dispose
  })
  flush()
  expect(actions).toEqual([1])
  source.set(3)
  flush()
  expect(actions).toEqual([1])
  source.set(4)
  flush()
  expect(actions).toEqual([1, 0])
  dispose()
  source.set(5)
  flush()
  expect(actions).toEqual([1, 0])
})


test('泛型转发与混合来源统一声明完成类型', async () => {
  function build<T>(source: T) { return createState(source) }
  const scope = createRoot(dispose => ({
    generic: build(Promise.resolve(3)),
    mixed: createState<number | Promise<number>>(Promise.resolve(4)),
    dispose,
  }))
  try {
    expectTypeOf(scope.generic).toEqualTypeOf<State<number>>()
    expectTypeOf(scope.mixed).toEqualTypeOf<State<number>>()
    await Promise.all([resolve(scope.generic.read), resolve(scope.mixed.read)])
    expect(scope.generic.read()).toBe(3)
    expect(scope.mixed.read()).toBe(4)
  } finally { scope.dispose() }
})

test('thenable 直接交付的嵌套 Promise 在读取与连续更新前完成展开', async () => {
  const inner = Promise.withResolvers<number>()
  const thenable: PromiseLike<Promise<number>> = {
    then(onfulfilled) {
      if (!onfulfilled) return Promise.reject(new Error('测试来源需要完成回调'))
      return Promise.resolve(onfulfilled(inner.promise))
    },
  }
  const scope = createRoot(dispose => ({ state: createState(thenable), dispose }))
  try {
    expectTypeOf(scope.state).toEqualTypeOf<State<number>>()
    inner.resolve(5)
    await resolve(scope.state.read)
    expect(scope.state.read()).toBe(5)
    scope.state.set(Promise.resolve(thenable))
    scope.state.set(previous => {
      expectTypeOf(previous).toEqualTypeOf<number>()
      expect(previous).toBe(5)
      return previous + 1
    })
    await until(() => scope.state.read() === 6)
    expect(scope.state.read()).toBe(6)
  } finally { scope.dispose() }
})


test('异步映射直接读取完成值，后续映射只接收完成结果', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot(dispose => {
    const source = createState(1)
    const mapped = source.map(() => deferred.promise)
    return { mapped, chained: mapped.map(value => value * 2), dispose }
  })
  try {
    expectTypeOf(scope.mapped.read).returns.toEqualTypeOf<number>()
    deferred.resolve(5)
    await Promise.resolve()
    flush()
    expect(scope.mapped.read()).toBe(5)
    expect(scope.chained.read()).toBe(10)
  } finally { scope.dispose() }
})


test('映射函数值保持身份，返回 StateView 随换源退订旧来源', () => {
  const fn = () => 7
  let runs = 0
  const scope = createRoot(dispose => {
    const chooseFirst = createState(true)
    const first = createState(1)
    const second = createState(2)
    const selected = chooseFirst.map(enabled => {
      runs += 1
      return enabled ? first : second
    })
    return { chooseFirst, first, second, selected, functionValue: first.map(() => fn), dispose }
  })
  try {
    expect(scope.functionValue.read()).toBe(fn)
    expect(scope.selected.read()).toBe(1)
    scope.chooseFirst.set(false)
    flush()
    expect(scope.selected.read()).toBe(2)
    const switchedRuns = runs
    scope.first.set(9)
    flush()
    expect(runs).toBe(switchedRuns)
    expect(scope.selected.read()).toBe(2)
    scope.second.set(3)
    flush()
    expect(scope.selected.read()).toBe(3)
    const map = scope.selected.map
    expect(map(value => value * 2).read()).toBe(6)
  } finally { scope.dispose() }
})

test('映射 thenable 的嵌套 Promise 直接读取为完成值', async () => {
  const inner = Promise.withResolvers<number>()
  const thenable: PromiseLike<Promise<number>> = {
    then(onfulfilled) {
      if (!onfulfilled) return Promise.reject(new Error('测试来源需要完成回调'))
      return Promise.resolve(onfulfilled(inner.promise))
    },
  }
  const scope = createRoot(dispose => ({ view: createState(0).map(() => thenable), dispose }))
  try {
    expectTypeOf(scope.view.read).returns.toEqualTypeOf<number>()
    inner.resolve(8)
    await resolve(scope.view.read)
    expect(scope.view.read()).toBe(8)
  } finally { scope.dispose() }
})

test.each(['完成', '拒绝'])('异步映射忽略过期%s，当前错误由读取传播', async outcome => {
  const stale = Promise.withResolvers<number>()
  const current = Promise.withResolvers<number>()
  const failure = Promise.withResolvers<number>()
  const error = new Error('当前映射失败')
  const scope = createRoot(dispose => {
    const source = createState(0)
    const view = source.map(index => index === 0 ? stale.promise : index === 1 ? current.promise : failure.promise)
    return { source, view, dispose }
  })
  try {
    scope.source.set(1)
    flush()
    current.resolve(6)
    await resolve(scope.view.read)
    expect(scope.view.read()).toBe(6)
    if (outcome === '完成') stale.resolve(99)
    else stale.reject(new Error('过期映射失败'))
    await Promise.resolve()
    flush()
    expect(scope.view.read()).toBe(6)
    scope.source.set(2)
    flush()
    const settled = resolve(scope.view.read)
    failure.reject(error)
    await expect(settled).rejects.toBe(error)
    expect(scope.view.read).toThrow('当前映射失败')
  } finally { scope.dispose() }
})

test('异步映射的作用域释放后停止跟随来源与迟到结果', async () => {
  const deferred = Promise.withResolvers<number>()
  const source = createState(0)
  const actions: number[] = []
  let runs = 0
  const dispose = createRoot(dispose => {
    const view = source.map(() => { runs += 1; return deferred.promise })
    createEffect(view, value => { actions.push(value) })
    return dispose
  })
  flush()
  const beforeDispose = runs
  dispose()
  deferred.resolve(9)
  source.set(1)
  await Promise.resolve()
  flush()
  expect(runs).toBe(beforeDispose)
  expect(actions).toEqual([])
})
