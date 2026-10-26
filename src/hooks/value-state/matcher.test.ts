/**
 * 匹配 StateView 的响应式行为验收。
 *
 * 验证匹配结果跟随值与条件来源变化，以及标识循环使用同一读取协议。
 *
 * 避免从原生 accessor 切换到 StateView 时丢失动态匹配能力。
 */
import { createRoot, flush } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createState, val, type StateView } from '@/foundation'
import { createIdent } from './ident'
import { createMatcher } from './matcher'

test('匹配与反向匹配通过 StateView 跟随值和响应式条件变化', () => {
  const {
    source,
    enabled,
    equalsOne,
    differsFromOne,
    matchesCondition,
    dispose,
  } = createRoot((dispose) => {
    const source = createState(1)
    const enabled = createState(true)
    const matcher = createMatcher(source)
    const equalsOne = matcher.match(1)
    const differsFromOne = matcher.notMatch(1)
    const matchesCondition = matcher.match((value) => value > 0 && val(enabled))

    return {
      source,
      enabled,
      equalsOne,
      differsFromOne,
      matchesCondition,
      dispose,
    }
  })
  try {
    expectTypeOf(equalsOne).toEqualTypeOf<StateView<boolean>>()
    expect(val(equalsOne)).toBe(true)
    expect(val(differsFromOne)).toBe(false)
    expect(val(matchesCondition)).toBe(true)

    enabled.set(false)
    flush()
    expect(val(matchesCondition)).toBe(false)
    source.set(2)
    flush()
    expect(val(equalsOne)).toBe(false)
    expect(val(differsFromOne)).toBe(true)
    enabled.set(true)
    flush()
    expect(val(matchesCondition)).toBe(true)
    source.set(0)
    flush()
    expect(val(matchesCondition)).toBe(false)
  } finally {
    dispose()
  }
})

test('标识循环的首尾匹配通过 StateView 跟随同一个标识状态', () => {
  const { ident, operator, first, last, dispose } = createRoot((dispose) => {
    const [ident, operator] = createIdent<'first' | 'last'>('first', {
      idents: ['first', 'last'],
    })
    const first = operator.matchFirst()
    const last = operator.matchLast()

    return { ident, operator, first, last, dispose }
  })
  try {
    expectTypeOf(first).toEqualTypeOf<StateView<boolean>>()
    expect(val(first)).toBe(true)
    expect(val(last)).toBe(false)
    operator.next()
    flush()
    expect(val(ident)).toBe('last')
    expect(val(first)).toBe(false)
    expect(val(last)).toBe(true)
    operator.reset()
    flush()
    expect(val(first)).toBe(true)
    expect(val(last)).toBe(false)
  } finally {
    dispose()
  }
})
