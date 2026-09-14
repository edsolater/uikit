/** 验证对象能够直接使用，并从当前状态继续派生。 */
import { expect, expectTypeOf, test } from 'vitest'
import { deriveable } from './derivable-object'

test('直接使用并从当前状态连续派生', () => {
  const original = deriveable({ amount: 1, active: true })
  original.amount = 2

  const next = original({ active: false })
  next.amount = 3
  const last = next()

  expect([original.amount, original.active]).toEqual([2, true])
  expect([next.amount, next.active]).toEqual([3, false])
  expect([last.amount, last.active]).toEqual([3, false])
  expectTypeOf(last).toEqualTypeOf(original)
})

test('首次读取接管来源属性，覆盖后只读取当前值', () => {
  const original = deriveable<{ count: number; late?: string }>({ count: 1 })
  const next = original()

  expect(next.count).toBe(1)
  original.count = 2
  original.late = 'added'
  expect(next.count).toBe(1)
  expect(next.late).toBe('added')

  next.count = 3
  original.count = 4
  expect(next.count).toBe(3)
})

test('对象属性首次写入时才与来源隔离', () => {
  const shared = { label: 'shared' }
  const original = deriveable({ items: [shared] })
  const next = original()

  next.items.push({ label: 'new' })

  expect(original.items).toEqual([shared])
  expect(next.items).toEqual([shared, { label: 'new' }])
  expect(next.items[0]).toBe(shared)
})

test('保持函数能力，方法以当前对象作为 this', () => {
  const original = deriveable({
    name: 'first',
    items: [1],
    append(this: { items: number[] }, item: number) {
      this.items.push(item)
    },
  })
  const next = original({ name: 'second' })

  next.append(2)

  expect(original.items).toEqual([1])
  expect(next.items).toEqual([1, 2])
  expect(next.name).toBe('second')
})
