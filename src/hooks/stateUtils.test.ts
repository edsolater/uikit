/** 验证现有派生入口的 Source 结果类型、异步身份、完成值去重与作用域清理。 */
import { createRoot, createEffect, resolve, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import {
  createState,
  val,
  type Source,
  type StateView,
  type State,
} from '@/foundation'
import { derive } from './stateUtils'

test('字段映射直接返回 Source，类型和运行值都展开为完成值', () => {
  const { selected, second, derived, dispose } = createRoot((dispose) => {
    const first = createState<string | undefined>('第一份')
    const second = createState<string | undefined>('第二份')
    const selected = createState({ source: first })
    const props: { size?: Source<string | undefined> } = {
      get size() {
        return val(selected).source
      },
    }
    const derived = derive(props, (s) => s.size)
    expectTypeOf(derived).toEqualTypeOf<StateView<string | undefined>>()
    return { selected, second, derived, dispose }
  })
  try {
    expect(val(derived)).toBe('第一份')
    selected.set({ source: second })
    flush()
    expect(val(derived)).toBe('第二份')
  } finally {
    dispose()
  }
})

test('mapper 创建的新 Promise 只随上游变化生产一次，普通函数保持数据', async () => {
  let calls = 0
  const handler = vi.fn(() => '业务函数')
  const source = createState(2)
  const { mapped, functionValue, dispose } = createRoot((dispose) => ({
    mapped: source.map((value) => {
      calls++
      return Promise.resolve(value * 2)
    }),
    functionValue: derive({ handler }, (props) => props.handler),
    dispose,
  }))
  expectTypeOf(mapped).toEqualTypeOf<StateView<number>>()
  expectTypeOf(functionValue).toEqualTypeOf<StateView<typeof handler>>()
  try {
    expect(await resolve(mapped.read)).toBe(4)
    expect(calls).toBe(1)
    source.set(3)
    flush()
    expect(await resolve(mapped.read)).toBe(6)
    expect(calls).toBe(2)
    expect(val(functionValue)).toBe(handler)
    expect(handler).not.toHaveBeenCalled()
  } finally {
    dispose()
  }
})

test('Promise 完成 State 后后继 map 接收标量，并持续跟随内部 State', async () => {
  let calls = 0
  const values: string[] = []
  const inner = createState('初值')
  const scope = createRoot((dispose) => {
    const mapped = derive({ value: Promise.resolve(inner) }, (props) => {
      calls++
      return props.value
    })
    const next = mapped.map((value) => {
      expectTypeOf(value).toEqualTypeOf<string>()
      return `${value}。`
    })
    createEffect(next.read, (value) => {
      values.push(value)
    })
    return { mapped, next, dispose }
  })
  try {
    expect(await resolve(scope.next.read)).toBe('初值。')
    flush()
    expect(values).toEqual(['初值。'])
    inner.set('新值')
    flush()
    expect(val(scope.next)).toBe('新值。')
    expect(calls).toBe(1)
    expect(values).toEqual(['初值。', '新值。'])
  } finally {
    scope.dispose()
  }
})

test('映射切换到同值 State 时不重跑后继 mapper 或重复通知', () => {
  let nextCalls = 0
  const values: string[] = []
  const selected = createState(true)
  const first = createState('相同值')
  const second = createState('相同值')
  const scope = createRoot((dispose) => {
    const mapped = selected.map((enabled) => (enabled ? first : second))
    const next = mapped.map((value) => {
      nextCalls++
      return `${value}。`
    })
    createEffect(next.read, (value) => {
      values.push(value)
    })
    return { next, dispose }
  })
  try {
    flush()
    expect(val(scope.next)).toBe('相同值。')
    selected.set(false)
    flush()
    expect(val(scope.next)).toBe('相同值。')
    expect(nextCalls).toBe(1)
    expect(values).toEqual(['相同值。'])
    second.set('新值')
    flush()
    expect(val(scope.next)).toBe('新值。')
  } finally {
    scope.dispose()
  }
})

test('等待中的派生作用域释放后，异步完成不再提交动作', async () => {
  const request = Promise.withResolvers<State<number>>()
  const inner = createState(3)
  const observed = vi.fn()
  let calls = 0
  const dispose = createRoot((dispose) => {
    const mapped = derive({}, () => {
      calls++
      return request.promise
    })
    expectTypeOf(mapped).toEqualTypeOf<StateView<number>>()
    createEffect(mapped.read, observed)
    return dispose
  })
  dispose()
  request.resolve(inner)
  await request.promise
  await Promise.resolve()
  flush()
  inner.set(7)
  flush()
  expect(observed).not.toHaveBeenCalled()
  expect(calls).toBe(1)
})
