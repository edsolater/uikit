/** 验证惰性读取、首次写入复制和复制深度。 */
import { expect, expectTypeOf, test } from 'vitest'
import { lazyCopy } from './lazy-copy'

test('非对象原值直接返回', () => {
  for (const value of [null, undefined, true, 1, NaN, 1n, 'text', Symbol('key')]) {
    expect(lazyCopy(value)).toBe(value)
  }
  expectTypeOf(lazyCopy({ items: [1] })).toEqualTypeOf<{ items: number[] }>()
})

test('读取保持来源，首次写入才固定当前浅副本', () => {
  let copies = 0
  const sourceValue = { count: 1, other: 2 }
  const source = new Proxy(sourceValue, {
    /** 记录浅复制发生的次数。 */
    ownKeys(target) { copies++; return Reflect.ownKeys(target) },
  })
  const next = lazyCopy(source)

  expect(next.count).toBe(1)
  sourceValue.count = 2
  expect(next.count).toBe(2)
  expect(copies).toBe(0)

  next.count = 3
  sourceValue.other = 4
  expect(next).toEqual({ count: 3, other: 2 })
  expect(sourceValue).toEqual({ count: 2, other: 4 })
  expect(copies).toBe(1)
})

test('默认只复制自身，更深的对象仍然共享', () => {
  const shared = { count: 1 }
  const source = { count: 1, shared }
  const next = lazyCopy(source)

  next.count = 2
  next.shared.count = 3

  expect(source.count).toBe(1)
  expect(source.shared.count).toBe(3)
  expect(next.shared).toBe(shared)
})

test('depth 指定继续写时复制的对象层数', () => {
  for (const depth of [0, 1, 2]) {
    const source = { child: { count: 1, nested: { count: 1 } } }
    const next = lazyCopy(source, { depth })

    next.child.count = 2
    next.child.nested.count = 3

    expect(source.child.count).toBe(depth >= 1 ? 1 : 2)
    expect(source.child.nested.count).toBe(depth >= 2 ? 1 : 3)
  }
})

test('数组方法在对应深度首次写入时复制数组', () => {
  const source = { items: [1] }
  const next = lazyCopy(source, { depth: 1 })

  next.items.push(2)

  expect(source.items).toEqual([1])
  expect(next.items).toEqual([1, 2])
})

test('可调用对象保持调用及属性写时复制', () => {
  /** 返回参数。 */
  function identity(value: number) { return value }
  const source = Object.assign(identity, { items: [1] })
  const next = lazyCopy(source, { depth: 1 })

  next.items.push(2)

  expect(next(3)).toBe(3)
  expect(source.items).toEqual([1])
  expect(next.items).toEqual([1, 2])
})
