/** 验证中性对象保留函数能力，并从当前属性连续派生。 */
import { expect, expectTypeOf, test } from 'vitest'
import { deriveObject } from './derivable-object'

test('对象可直接使用，也可连续派生当前属性', () => {
  const original = deriveObject({ amount: 1 })
  original.amount = 2
  const next = original()
  next.amount = 3
  const last = next()
  expect(original.amount).toBe(2)
  expect(last.amount).toBe(3)
  expect(next).not.toBe(original)
  expect(Object.hasOwn(last, 'amount')).toBe(true)
  expectTypeOf(last).toEqualTypeOf(original)
})

test('保持完整函数能力，数组按写入隔离并共享方法引用', () => {
  const methods = {
    /** 向接收者加入一项。 */
    append(this: { items: number[] }, item: number) { this.items.push(item) },
  }
  const original = deriveObject({ items: [1], ...methods })
  const next = original()
  next.append(2)
  expect(original.items).toEqual([1])
  expect(next.items).toEqual([1, 2])
  expect(next.append).toBe(original.append)
  expect(original).toBeInstanceOf(Function)
  expect(next).toBeInstanceOf(Function)
  expect(typeof original.call).toBe('function')
  expect(typeof original.bind).toBe('function')
  expect(original.call(undefined).items).toEqual([1])
  expect(original.bind(undefined)().items).toEqual([1])

  const withLabel = deriveObject({ count: 1, label: 'shared' })
  expect(withLabel().label).toBe('shared')
})

test('数组和普通对象按首次写入隔离，更深引用保持共享', () => {
  const shared = { label: 'shared' }
  const original = deriveObject({ items: [shared], metadata: { shared } })
  const next = original()
  next.items.push({ label: 'new' })
  expect(original.items).toHaveLength(1)
  expect(next.items).not.toBe(original.items)
  expect(next.items[0]).toBe(shared)
  expect(next.metadata).not.toBe(original.metadata)
  expect(next.metadata.shared).toBe(next.items[0])
  next.metadata.shared.label = 'changed'
  expect(next.items[0].label).toBe('changed')
  expect(shared.label).toBe('changed')
})

test('派生和读取不复制属性容器，首次写入才枚举来源', () => {
  let enumerations = 0
  const items = new Proxy([1], {
    /** 记录浅复制所需的属性枚举。 */
    ownKeys(target) { enumerations++; return Reflect.ownKeys(target) },
  })
  const original = deriveObject({ items })
  const next = original()
  const last = next()
  expect(last.items[0]).toBe(1)
  expect(enumerations).toBe(0)
  next.items.push(2)
  expect(enumerations).toBe(1)
  expect([...last.items]).toEqual([1, 2])
  last.items.push(3)
  expect([...next.items]).toEqual([1, 2])
  expect([...original.items]).toEqual([1])
  expect([...last().items]).toEqual([1, 2, 3])
})

test('领域 name 属性不会被函数自身属性阻挡', () => {
  const original = deriveObject({ name: 'first', amount: 2 })
  const next = original()
  next.name = 'second'
  next.amount = 3
  expect(original.name).toBe('first')
  expect(next.name).toBe('second')
  expect(original.amount).toBe(2)
  expect(next.amount).toBe(3)
})

test('options.override 明确覆盖每次派生后的属性', () => {
  const original = deriveObject(
    { isActive: true, amount: 1 },
    { overrideWhenDerive: { isActive: false } },
  )
  const next = original()
  next.amount = 2
  const last = next()
  expect(original.isActive).toBe(true)
  expect(next.isActive).toBe(false)
  expect(last.isActive).toBe(false)
  expect(last.amount).toBe(2)
})
