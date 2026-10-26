import {
  createEffect,
  createRoot,
  createSignal,
  flush,
  resolve,
  until,
  getOwner,
  runWithOwner,
} from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createAsyncSignal } from './createAsyncSignal'

test('同步连续更新沿待提交值累积，初始函数仍跟随依赖', () => {
  const scope = createRoot((dispose) => {
    const [source, setSource] = createSignal(1)
    return { state: createAsyncSignal(() => source() * 2), setSource, dispose }
  })
  const [read, write] = scope.state
  try {
    write((value) => value + 1)
    write((value) => value + 1)
    flush()
    expect(read()).toBe(4)
    scope.setSource(5)
    flush()
    expect(read()).toBe(10)
  } finally {
    scope.dispose()
  }
})

test('初始 Promise 未完成时，连续更新等待完成值并依次执行', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot((dispose) => ({
    state: createAsyncSignal(deferred.promise),
    dispose,
  }))
  const [read, write] = scope.state
  const received: number[] = []
  try {
    write((value) => {
      received.push(value)
      return value + 1
    })
    write((value) => {
      received.push(value)
      return value * 2
    })
    expect(received).toEqual([])
    deferred.resolve(5)
    expect(await resolve(read)).toBe(12)
    expect(received).toEqual([5, 6])
  } finally {
    scope.dispose()
  }
})

test('后续 Promise 赋值与异步更新共用结果计算，更新函数只收到完成值', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot((dispose) => ({
    state: createAsyncSignal(0),
    dispose,
  }))
  const [read, write] = scope.state
  try {
    write(deferred.promise)
    write((value) => Promise.resolve(value + 1))
    write((value) => value * 2)
    const settled = until(() => read() === 12)
    deferred.resolve(5)
    await settled
    expect(read()).toBe(12)
    write((value) => value + 1)
    await until(() => read() === 13)
    expect(read()).toBe(13)
  } finally {
    scope.dispose()
  }
})

test('较晚的直接赋值不被先前异步更新的迟到结果覆盖', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot((dispose) => ({
    state: createAsyncSignal(0),
    dispose,
  }))
  const [read, write] = scope.state
  try {
    write(deferred.promise)
    write((value) => value + 1)
    write(20)
    flush()
    expect(read()).toBe(20)
    deferred.resolve(5)
    await deferred.promise
    await Promise.resolve()
    flush()
    expect(read()).toBe(20)
  } finally {
    scope.dispose()
  }
})

test('异步失败传播给消费者，直接赋值可以恢复', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot((dispose) => ({
    state: createAsyncSignal(deferred.promise),
    dispose,
  }))
  const [read, write] = scope.state
  const update = Promise.withResolvers<number>()
  try {
    write(() => update.promise)
    flush()
    const result = resolve(read)
    const error = new Error('更新失败')
    const rejection = expect(result).rejects.toBe(error)
    deferred.resolve(1)
    update.reject(error)
    await rejection
    write(3)
    flush()
    expect(read()).toBe(3)
  } finally {
    scope.dispose()
  }
})

test('unobserved 只在对外结果失去订阅时通知一次，lazy 重新读取保留写入来源', () => {
  let unobserved = 0
  const scope = createRoot((dispose) => ({
    state: createAsyncSignal(1, {
      lazy: true,
      unobserved: () => {
        unobserved++
      },
    }),
    dispose,
  }))
  const stop = createRoot((dispose) => {
    createEffect(scope.state[0], () => {})
    return dispose
  })
  try {
    flush()
    scope.state[1](2)
    flush()
    stop()
    flush()
    expect(unobserved).toBe(1)
    expect(scope.state[0]()).toBe(2)
  } finally {
    stop()
    scope.dispose()
  }
})

test('equals:false 不被来源层截断，自定义相等判断只收到完成值', async () => {
  const actions: number[] = []
  const scope = createRoot((dispose) => {
    const state = createAsyncSignal(1, { equals: false })
    createEffect(state[0], (value) => {
      actions.push(value)
    })
    return { state, dispose }
  })
  try {
    flush()
    scope.state[1](1)
    flush()
    expect(actions).toEqual([1, 1])
  } finally {
    scope.dispose()
  }

  const comparisons: number[][] = []
  const compared = createRoot((dispose) => ({
    state: createAsyncSignal(1, {
      equals: (a, b) => {
        comparisons.push([a, b])
        return a === b
      },
    }),
    dispose,
  }))
  try {
    compared.state[1](Promise.resolve(2))
    await until(() => compared.state[0]() === 2)
    expect(compared.state[0]()).toBe(2)
    expect(comparisons).toContainEqual([1, 2])
    expect(comparisons.flat().every((value) => typeof value === 'number')).toBe(
      true,
    )
  } finally {
    compared.dispose()
  }
})

test('lazy 首次读取建立当前值，之后写入保留结果', () => {
  let initialized = 0
  const scope = createRoot((dispose) => ({
    direct: createAsyncSignal(
      () => {
        initialized++
        return 1
      },
      { lazy: true },
    ),
    updated: createAsyncSignal(
      () => {
        initialized++
        return 2
      },
      { lazy: true },
    ),
    dispose,
  }))
  try {
    expect(initialized).toBe(0)
    expect(scope.direct[0]()).toBe(1)
    scope.direct[1](5)
    flush()
    expect(scope.direct[0]()).toBe(5)
    expect(initialized).toBe(1)
    expect(scope.updated[0]()).toBe(2)
    scope.updated[1]((value) => value + 1)
    flush()
    expect(scope.updated[0]()).toBe(3)
    expect(initialized).toBe(2)
  } finally {
    scope.dispose()
  }
})

test('loadingValue 提供初始完成值，ownedWrite 显式允许所属作用域内写入', async () => {
  const deferred = Promise.withResolvers<number>()
  const scope = createRoot((dispose) => {
    const state = createAsyncSignal(deferred.promise, {
      loadingValue: 0,
      ownedWrite: true,
    })
    state[1](1)
    return { state, dispose }
  })
  try {
    flush()
    expect(scope.state[0]()).toBe(1)
    deferred.resolve(9)
    await deferred.promise
    flush()
    expect(scope.state[0]()).toBe(1)
  } finally {
    scope.dispose()
  }

  const loading = Promise.withResolvers<number>()
  const placeholder = createRoot((dispose) => ({
    state: createAsyncSignal(loading.promise, { loadingValue: 0 }),
    dispose,
  }))
  try {
    expect(placeholder.state[0]()).toBe(0)
    loading.resolve(9)
    await loading.promise
    await Promise.resolve()
    flush()
    expect(placeholder.state[0]()).toBe(9)
  } finally {
    placeholder.dispose()
  }
})

test('泛型与函数值保留正确类型，函数数据不被当作来源再次执行', () => {
  const scope = createRoot((dispose) => ({
    state: createAsyncSignal(() => () => 7),
    dispose,
  }))
  try {
    expectTypeOf(scope.state[0]()).toEqualTypeOf<() => number>()
    expect(scope.state[0]()()).toBe(7)
    const next = () => 9
    scope.state[1](() => next)
    flush()
    expect(scope.state[0]()).toBe(next)
  } finally {
    scope.dispose()
  }
})

test('底层入口的显式异步泛型与泛型转发读取完成类型', async () => {
  function build<T>(source: T) {
    return createAsyncSignal(source)
  }
  const scope = createRoot((dispose) => ({
    explicit: createAsyncSignal<Promise<number>>(Promise.resolve(2), {
      loadingValue: 0,
    }),
    generic: build(Promise.resolve(3)),
    mixed: createAsyncSignal<number | Promise<number>>(Promise.resolve(4)),
    dispose,
  }))
  try {
    for (const [read] of [scope.explicit, scope.generic, scope.mixed]) {
      expectTypeOf(read).returns.toEqualTypeOf<number>()
    }
    scope.explicit[1]((previous) => {
      expectTypeOf(previous).toEqualTypeOf<number>()
      return previous + 1
    })
    await Promise.all([
      resolve(scope.explicit[0]),
      resolve(scope.generic[0]),
      resolve(scope.mixed[0]),
    ])
    expect(scope.explicit[0]()).toBe(3)
    expect(scope.generic[0]()).toBe(3)
    expect(scope.mixed[0]()).toBe(4)
  } finally {
    scope.dispose()
  }
})

test('计算作用域仍拒绝写入', () => {
  const scope = createRoot((dispose) => ({
    state: createAsyncSignal(() => 1),
    owner: getOwner(),
    dispose,
  }))
  try {
    expect(() => runWithOwner(scope.owner, () => scope.state[1](7))).toThrow(
      'REACTIVE_WRITE_IN_OWNED_SCOPE',
    )
  } finally {
    scope.dispose()
  }
})
test('上游变更即使产生同一派生值，也撤销手动覆盖', () => {
  const scope = createRoot((dispose) => {
    const [read, write] = createSignal(1)
    return {
      state: createAsyncSignal(() => {
        read()
        return 2
      }),
      write,
      dispose,
    }
  })
  try {
    scope.state[1](9)
    flush()
    expect(scope.state[0]()).toBe(9)
    scope.write(2)
    flush()
    expect(scope.state[0]()).toBe(2)
  } finally {
    scope.dispose()
  }
})
