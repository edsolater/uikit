/** 验证 State 的统一异步读写、函数值与派生生命周期。 */
import { createRoot, flush, resolve, until } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createEffect } from '../createEffect'
import { createState, isState, type State } from './state'
import { isStateView, stateView } from './state-view'
import { readStateSource } from './state-source'
import type { Source } from './source'

test('直接接收上游State，读取值且独立写入，后续上游变化继续传入', () => {
  const scope = createRoot(dispose => {
    const outside = createState(false)
    return { outside, inside: createState(outside), dispose }
  })
  try {
    expectTypeOf(scope.inside).toEqualTypeOf<State<boolean>>()
    expect(isState(scope.inside)).toBe(true)
    expect(isStateView(scope.inside)).toBe(true)
    expect(stateView(scope.inside)).toBe(scope.inside)
    expect(readStateSource(scope.inside)).toBe(scope.outside)
    expect(scope.inside()).toBe(false)
    scope.inside.set(true)
    flush()
    expect(scope.inside()).toBe(true)
    expect(scope.outside()).toBe(false)
    scope.outside.set(true)
    flush()
    scope.outside.set(false)
    flush()
    expect(scope.inside()).toBe(false)
  } finally {
    scope.dispose()
  }
})

test('StateView及Source泛型直接作为来源，选项与相对更新使用内容值类型', () => {
  function build<T>(source: Source<T>) {
    return createState(source)
  }
  const scope = createRoot(dispose => {
    const outside = createState(2)
    const inside = createState<number>(
      stateView(outside, value => value * 2),
      {
        equals(previous, next) {
          expectTypeOf(previous).toEqualTypeOf<number>()
          expectTypeOf(next).toEqualTypeOf<number>()
          return previous === next
        },
      },
    )
    return { outside, inside, forwarded: build(outside), dispose }
  })
  try {
    expectTypeOf(scope.inside).toEqualTypeOf<State<number>>()
    expectTypeOf(scope.forwarded).toEqualTypeOf<State<number>>()
    expect(scope.inside()).toBe(4)
    scope.inside.set(previous => {
      expectTypeOf(previous).toEqualTypeOf<number>()
      return previous + 1
    })
    flush()
    expect(scope.inside()).toBe(5)
    expect(scope.outside()).toBe(2)
    scope.outside.set(3)
    flush()
    expect(scope.inside()).toBe(6)
    expect(scope.forwarded()).toBe(3)
  } finally {
    scope.dispose()
  }
})

test('计算来源可直接返回State，选择变化后跟随新来源并停止响应旧来源', () => {
  const scope = createRoot(dispose => {
    const chooseFirst = createState(true)
    const first = createState(1)
    const second = createState(2)
    const selected = createState(() => (chooseFirst() ? first : second))
    return { chooseFirst, first, second, selected, dispose }
  })
  try {
    expectTypeOf(scope.selected).toEqualTypeOf<State<number>>()
    expectTypeOf(scope.selected()).toEqualTypeOf<number>()
    expect(scope.selected()).toBe(1)
    scope.first.set(3)
    flush()
    expect(scope.selected()).toBe(3)
    scope.chooseFirst.set(false)
    flush()
    expect(scope.selected()).toBe(2)
    scope.first.set(9)
    flush()
    expect(scope.selected()).toBe(2)
    scope.second.set(4)
    flush()
    expect(scope.selected()).toBe(4)
  } finally {
    scope.dispose()
  }
})

test('Promise完成后得到State来源，直接读取值并持续跟随其更新', async () => {
  const deferred = Promise.withResolvers<State<number>>()
  const scope = createRoot(dispose => {
    const outside = createState(3)
    return { outside, inside: createState(deferred.promise), dispose }
  })
  try {
    expectTypeOf(scope.inside).toEqualTypeOf<State<number>>()
    deferred.resolve(scope.outside)
    expect(await resolve(scope.inside)).toBe(3)
    scope.outside.set(7)
    flush()
    expect(scope.inside()).toBe(7)
    scope.inside.set(previous => previous + 1)
    await until(() => scope.inside() === 8)
    expect(scope.outside()).toBe(7)
  } finally {
    scope.dispose()
  }
})

test('异步来源尚未完成时，相对更新等待State中的内容值', async () => {
  const deferred = Promise.withResolvers<State<number>>()
  const scope = createRoot(dispose => ({
    inside: createState(deferred.promise),
    dispose,
  }))
  try {
    scope.inside.set(previous => {
      expectTypeOf(previous).toEqualTypeOf<number>()
      expect(previous).toBe(4)
      return previous + 1
    })
    deferred.resolve(createState(4))
    expect(await resolve(scope.inside)).toBe(5)
  } finally {
    scope.dispose()
  }
})

test('Promise中的State仍在等待时，相对更新等待最终内容值', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot(dispose => {
    const outside = createState(deferred.promise)
    return { inside: createState(Promise.resolve(outside)), dispose }
  })
  try {
    scope.inside.set(previous => previous + 1)
    await Promise.resolve()
    await Promise.resolve()
    deferred.resolve(5)
    expect(await resolve(scope.inside)).toBe(6)
  } finally {
    scope.dispose()
  }
})

test('后续赋值也接受State来源，直接读取内容并跟随该来源更新', () => {
  const scope = createRoot(dispose => ({
    outside: createState(2),
    inside: createState(0),
    dispose,
  }))
  try {
    scope.inside.set(scope.outside)
    flush()
    expect(scope.inside()).toBe(2)
    scope.outside.set(4)
    flush()
    expect(scope.inside()).toBe(4)
    scope.inside.set(previous => previous + 1)
    flush()
    expect(scope.inside()).toBe(5)
    expect(scope.outside()).toBe(4)
  } finally {
    scope.dispose()
  }
})

test('无依赖初始化只执行一次，函数值保持身份，写入随 Solid 提交', () => {
  let initialized = 0
  const fn = () => 7
  const value = createState(() => {
    initialized += 1
    return fn
  })
  expect(initialized).toBe(1)
  expect(value()).toBe(fn)
  const next = () => 9
  value.set(() => next)
  flush()
  expect(value()).toBe(next)
  expect(initialized).toBe(1)
  const number = createState(1)
  number.set(previous => previous + 1)
  flush()
  expect(number()).toBe(2)
})

test('State 以完成类型声明，初始与后续异步输入不要求业务解包', async () => {
  const initial = Promise.withResolvers<number>()
  const next = Promise.withResolvers<number>()
  const scope = createRoot(dispose => ({
    state: createState(initial.promise),
    dispose,
  }))
  try {
    expectTypeOf(scope.state).toEqualTypeOf<State<number>>()
    scope.state.set(value => value + 1)
    initial.resolve(2)
    expect(await resolve(scope.state)).toBe(3)
    expect(scope.state.set(next.promise)).toBe(scope.state)
    scope.state.set(value => Promise.resolve(value * 2))
    const settled = until(() => scope.state() === 10)
    next.resolve(5)
    await settled
    expect(scope.state()).toBe(10)
  } finally {
    scope.dispose()
  }
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
    expect(scope.state()).toBe(0)
    scope.state.set(previous => {
      expectTypeOf(previous).toEqualTypeOf<number>()
      received.push(previous)
      return previous + 1
    })
    deferred.resolve(5)
    await until(() => scope.state() === 6)
    expect(scope.state()).toBe(6)
    expect(received).toEqual([5])
    expect(comparisons.flat().every(value => typeof value === 'number')).toBe(
      true,
    )
    scope.state.set(8)
    await until(() => scope.state() === 8)
    expect(scope.state()).toBe(8)
  } finally {
    scope.dispose()
  }
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
      resolve(scope.thenable),
      resolve(scope.nested),
      resolve(scope.computed),
    ])
    expect(scope.thenable()).toBe(7)
    expect(scope.nested()).toBe(7)
    expect(scope.computed()).toBe(9)
  } finally {
    scope.dispose()
  }
})

test('相同派生值不重复触发消费者动作，作用域退出后停止通知', () => {
  const source = createState(1)
  const actions: number[] = []
  const dispose = createRoot(dispose => {
    const parity = source._map(value => value % 2)
    createEffect(parity, value => {
      actions.push(value)
    })
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
  function build<T>(source: T) {
    return createState(source)
  }
  const scope = createRoot(dispose => ({
    generic: build(Promise.resolve(3)),
    mixed: createState<number | Promise<number>>(Promise.resolve(4)),
    dispose,
  }))
  try {
    expectTypeOf(scope.generic).toEqualTypeOf<State<number>>()
    expectTypeOf(scope.mixed).toEqualTypeOf<State<number>>()
    await Promise.all([resolve(scope.generic), resolve(scope.mixed)])
    expect(scope.generic()).toBe(3)
    expect(scope.mixed()).toBe(4)
  } finally {
    scope.dispose()
  }
})

test('thenable 直接交付的嵌套 Promise 在读取与连续更新前完成展开', async () => {
  const inner = Promise.withResolvers<number>()
  const thenable: PromiseLike<Promise<number>> = {
    then(onfulfilled) {
      if (!onfulfilled) return Promise.reject(new Error('测试来源需要完成回调'))
      return Promise.resolve(onfulfilled(inner.promise))
    },
  }
  const scope = createRoot(dispose => ({
    state: createState(thenable),
    dispose,
  }))
  try {
    expectTypeOf(scope.state).toEqualTypeOf<State<number>>()
    inner.resolve(5)
    await resolve(scope.state)
    expect(scope.state()).toBe(5)
    scope.state.set(Promise.resolve(thenable))
    scope.state.set(previous => {
      expectTypeOf(previous).toEqualTypeOf<number>()
      expect(previous).toBe(5)
      return previous + 1
    })
    await until(() => scope.state() === 6)
    expect(scope.state()).toBe(6)
  } finally {
    scope.dispose()
  }
})

test('异步映射直接读取完成值，后续映射只接收完成结果', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot(dispose => {
    const source = createState(1)
    const mapped = source._map(() => deferred.promise)
    return { mapped, chained: mapped._map(value => value * 2), dispose }
  })
  try {
    expectTypeOf(scope.mapped._read).returns.toEqualTypeOf<number>()
    deferred.resolve(5)
    await Promise.resolve()
    flush()
    expect(scope.mapped._read()).toBe(5)
    expect(scope.chained._read()).toBe(10)
  } finally {
    scope.dispose()
  }
})

test('映射函数值保持身份，返回 StateView 随换源退订旧来源', () => {
  const fn = () => 7
  let runs = 0
  const scope = createRoot(dispose => {
    const chooseFirst = createState(true)
    const first = createState(1)
    const second = createState(2)
    const selected = chooseFirst._map(enabled => {
      runs += 1
      return enabled ? first : second
    })
    return {
      chooseFirst,
      first,
      second,
      selected,
      functionValue: first._map(() => fn),
      dispose,
    }
  })
  try {
    expect(scope.functionValue._read()).toBe(fn)
    expect(scope.selected._read()).toBe(1)
    scope.chooseFirst.set(false)
    flush()
    expect(scope.selected._read()).toBe(2)
    const switchedRuns = runs
    scope.first.set(9)
    flush()
    expect(runs).toBe(switchedRuns)
    expect(scope.selected._read()).toBe(2)
    scope.second.set(3)
    flush()
    expect(scope.selected._read()).toBe(3)
    const map = scope.selected._map
    expect(map(value => value * 2)._read()).toBe(6)
  } finally {
    scope.dispose()
  }
})

test('映射 thenable 的嵌套 Promise 直接读取为完成值', async () => {
  const inner = Promise.withResolvers<number>()
  const thenable: PromiseLike<Promise<number>> = {
    then(onfulfilled) {
      if (!onfulfilled) return Promise.reject(new Error('测试来源需要完成回调'))
      return Promise.resolve(onfulfilled(inner.promise))
    },
  }
  const scope = createRoot(dispose => ({
    view: createState(0)._map(() => thenable),
    dispose,
  }))
  try {
    expectTypeOf(scope.view._read).returns.toEqualTypeOf<number>()
    inner.resolve(8)
    await resolve(scope.view._read)
    expect(scope.view._read()).toBe(8)
  } finally {
    scope.dispose()
  }
})

test.each(['完成', '拒绝'])(
  '异步映射忽略过期%s，当前错误由读取传播',
  async outcome => {
    const stale = Promise.withResolvers<number>()
    const current = Promise.withResolvers<number>()
    const failure = Promise.withResolvers<number>()
    const error = new Error('当前映射失败')
    const scope = createRoot(dispose => {
      const source = createState(0)
      const view = source._map(index =>
        index === 0
          ? stale.promise
          : index === 1
            ? current.promise
            : failure.promise,
      )
      return { source, view, dispose }
    })
    try {
      scope.source.set(1)
      flush()
      current.resolve(6)
      await resolve(scope.view._read)
      expect(scope.view._read()).toBe(6)
      if (outcome === '完成') stale.resolve(99)
      else stale.reject(new Error('过期映射失败'))
      await Promise.resolve()
      flush()
      expect(scope.view._read()).toBe(6)
      scope.source.set(2)
      flush()
      const settled = resolve(scope.view._read)
      failure.reject(error)
      await expect(settled).rejects.toBe(error)
      expect(scope.view._read).toThrow('当前映射失败')
    } finally {
      scope.dispose()
    }
  },
)

test('异步映射的作用域释放后停止跟随来源与迟到结果', async () => {
  const deferred = Promise.withResolvers<number>()
  const source = createState(0)
  const actions: number[] = []
  let runs = 0
  const dispose = createRoot(dispose => {
    const view = source._map(() => {
      runs += 1
      return deferred.promise
    })
    createEffect(view, value => {
      actions.push(value)
    })
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
