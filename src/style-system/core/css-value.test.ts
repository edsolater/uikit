/** 验证 Value 分支集合的统一输入。 */
import { expect, test, vi } from 'vitest'
import { value, type ValueBranches, type ValueInput } from './css-value'

const expected: [string, ValueInput][] = [['hover', 0.72], ['active', 0.62]]

/** 生成键值条目。 */
function* branches(): IterableIterator<[string, ValueInput]> {
  yield ['hover', 0.72]
  yield ['active', 0.62]
}

test('对象、Map、Set、数组与生成器形成相同分支', () => {
  const inputs: ValueBranches[] = [
    { hover: 0.72, active: 0.62 },
    new Map(expected),
    new Set(expected),
    expected,
    branches(),
  ]
  for (const input of inputs) expect(value(0.82, input).conditions).toEqual(expected)
})

test('按需配置不被当作分支，字符串不被逐字展开', () => {
  const onActive = vi.fn()
  expect(value(1, { onActive })).toMatchObject({ conditions: [], onActive })
  expect(value(1, { onActive: 2 }).conditions).toEqual([['onActive', 2]])
  expect(() => value(1, 'hover' as unknown as ValueBranches)).toThrow('名称对象或键值 Iterable')
})
