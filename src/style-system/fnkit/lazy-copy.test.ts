/** 验证惰性读取、首次写入隔离和对象图关系。 */
import { expect, expectTypeOf, test } from 'vitest'
import { lazyCopy } from './lazy-copy'

test('非对象原值返回并保留类型', () => {
  for (const value of [null, undefined, true, 1, NaN, 1n, 'text', Symbol('key')]) {
    expect(lazyCopy(value)).toBe(value)
  }
  expectTypeOf(lazyCopy({ items: [1] })).toEqualTypeOf<{ items: number[] }>()
})

test('读取不枚举或复制，首次写入才固定当前对象属性', () => {
  let enumerations = 0
  const original = { count: 1, other: 2 }
  const source = new Proxy(original, {
    /** 记录浅复制需要的属性枚举。 */
    ownKeys(target) { enumerations++; return Reflect.ownKeys(target) },
  })
  const next = lazyCopy(source)
  expect(next.count).toBe(1)
  original.count = 2
  expect(next.count).toBe(2)
  expect(enumerations).toBe(0)
  next.count = 3
  expect(enumerations).toBe(1)
  original.other = 4
  expect(next.other).toBe(2)
  next.count = 5
  expect(enumerations).toBe(1)
  expect(original.count).toBe(2)
})

test('深层模式隔离数组 push、sort、splice 和 length 写入', () => {
  const source = { items: [3, 1], untouched: { count: 1 } }
  const next = lazyCopy(source, { deep: true })
  const items = next.items
  items.push(2)
  next.items.sort()
  expect(next.items).toBe(items)
  expect([...next.items]).toEqual([1, 2, 3])
  next.items.splice(1, 1)
  next.items.length = 1
  expect(Array.isArray(next.items)).toBe(true)
  expect([...next.items]).toEqual([1])
  expect(source.items).toEqual([3, 1])
  source.untouched.count = 7
  expect(next.untouched.count).toBe(7)
})

test('深层模式隔离嵌套赋值、删除、定义属性和枚举', () => {
  const key = Symbol('count')
  const source = { inner: { count: 1, removable: true as boolean | undefined, [key]: 2 } }
  const next = lazyCopy(source, { deep: true })
  next.inner.count = 3
  delete next.inner.removable
  Object.defineProperty(next.inner, key, { value: 4 })
  expect({ ...next.inner }).toEqual({ count: 3, [key]: 4 })
  expect('removable' in next.inner).toBe(false)
  expect(source.inner).toEqual({ count: 1, removable: true, [key]: 2 })
})

test('同一对象的多个入口、循环引用和已取出的代理保持一致', () => {
  const shared = { count: 1 }
  const source: { left: typeof shared; right: typeof shared; self?: unknown } = {
    left: shared, right: shared,
  }
  source.self = source
  const next = lazyCopy(source, { deep: true })
  const left = next.left
  expect(next.left).toBe(next.right)
  expect(next.self).toBe(next)
  left.count = 2
  expect(next.right.count).toBe(2)
  expect(shared.count).toBe(1)
  next.left = { count: 3 }
  left.count = 4
  expect(next.left.count).toBe(3)
  expect(next.right.count).toBe(4)
})

test('访问器不被复制求值，setter 和普通方法使用副本接收者', () => {
  let reads = 0
  const source = {
    count: 1,
    /** 读取并记录访问次数。 */
    get doubled() { reads++; return this.count * 2 },
    /** 将双倍值写回计数。 */
    set doubled(value: number) { this.count = value / 2 },
    /** 增加计数。 */
    increment() { this.count++ },
  }
  const next = lazyCopy(source)
  next.doubled = 6
  expect(reads).toBe(0)
  next.increment()
  expect(next.doubled).toBe(8)
  expect(source.count).toBe(1)
})

test('函数保留直接调用、call、bind，深层模式隔离嵌套属性', () => {
  /** 计算参数与接收者计数之和。 */
  function sum(this: { count: number } | void, amount: number) {
    return (this ? this.count : 0) + amount
  }
  const source = Object.assign(sum, { items: [1] })
  const next = lazyCopy(source, { deep: true })
  expect(next(2)).toBe(2)
  expect(next.call({ count: 3 }, 2)).toBe(5)
  expect(next.bind({ count: 4 })(2)).toBe(6)
  next.items.push(2)
  expect(source.items).toEqual([1])
  expect([...next.items]).toEqual([1, 2])
  expect(next).toBeInstanceOf(Function)
})

test('函数构造与普通类实例的公开字段仍然可用', () => {
  class Counter {
    count = 1
    /** 增加公开计数。 */
    increment() { this.count++ }
  }
  const Constructor = lazyCopy(Counter)
  const source = new Constructor()
  const next = lazyCopy(source)
  next.increment()
  expect(next).toBeInstanceOf(Counter)
  expect(next.count).toBe(2)
  expect(source.count).toBe(1)
})

test('各次复制相互隔离，并保留描述符约束与冻结操作', () => {
  const source = { inner: { count: 1 } }
  const first = lazyCopy(source, { deep: true })
  const second = lazyCopy(source, { deep: true })
  first.inner.count = 2
  expect(second.inner.count).toBe(1)
  Object.freeze(first)
  expect(Object.isFrozen(first)).toBe(true)
  expect(first.inner.count).toBe(2)
  expect(Object.isFrozen(source)).toBe(false)
  const frozen = lazyCopy(Object.freeze({ inner: source.inner }))
  expect(frozen.inner.count).toBe(1)
  expect(Reflect.set(frozen, 'inner', { count: 3 })).toBe(false)
})

test('默认浅层模式只隔离当前容器，字段与数组元素保持原引用', () => {
  const shared = { count: 1 }
  const source = { count: 1, shared }
  const next = lazyCopy(source)
  const items = [shared]
  const nextItems = lazyCopy(items)
  expect(next.shared).toBe(shared)
  expect(nextItems[0]).toBe(shared)
  next.count = 2
  nextItems.push({ count: 3 })
  expect(source.count).toBe(1)
  expect(items).toHaveLength(1)
  expect(nextItems).toHaveLength(2)
  next.shared.count = 4
  expect(shared.count).toBe(4)
})

test('显式定义的固定对象属性遵守 JavaScript 的引用身份约束', () => {
  const source = {}
  const next = lazyCopy(source)
  const fixed = { count: 1 }
  Object.defineProperty(next, 'fixed', { value: fixed })
  expect(Reflect.get(next, 'fixed')).toBe(fixed)
  expect(Object.getOwnPropertyDescriptor(next, 'fixed')?.value).toBe(fixed)
  expect(Object.hasOwn(source, 'fixed')).toBe(false)
})
