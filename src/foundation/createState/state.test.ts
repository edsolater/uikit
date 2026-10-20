/** 验证 State 自有存储不会把函数值、Promise 或立即读取交给运行时重新解释。 */
import { createRoot, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { createEffect } from '../createEffect'
import { createState } from './state'

test('初始化只执行一次，函数值和 Promise 保持身份，写入后立即读到当前值', () => {
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
  expect(value.read()).toBe(next)
  expect(initialized).toBe(1)
  const promise = Promise.resolve(3)
  const promised = createState(promise)
  expect(promised.read()).toBe(promise)
  const mapped = promised.map(current => current)
  expect(mapped.read()).toBe(promise)
  const number = createState(1)
  number.set(previous => previous + 1)
  expect(number.read()).toBe(2)
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
