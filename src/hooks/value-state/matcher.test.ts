/**
 * 匹配 StateView 的响应式行为验收。
 *
 * 验证匹配结果跟随值与条件来源变化，以及标识循环使用同一读取协议。
 *
 * 避免从原生 accessor 切换到 StateView 时丢失动态匹配能力。
 */
import { createRoot } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createState, val, type StateView } from '@/foundation'
import { createIdent } from './ident'
import { createMatcher } from './matcher'

test('匹配与反向匹配通过 StateView 跟随值和响应式条件变化', () => {
  createRoot((dispose) => {
    const source = createState(1)
    const enabled = createState(true)
    const matcher = createMatcher(source)
    const equalsOne = matcher.match(1)
    const differsFromOne = matcher.notMatch(1)
    const matchesCondition = matcher.match((value) => value > 0 && val(enabled))

    expectTypeOf(equalsOne).toEqualTypeOf<StateView<boolean>>()
    expect(val(equalsOne)).toBe(true)
    expect(val(differsFromOne)).toBe(false)
    expect(val(matchesCondition)).toBe(true)

    enabled.set(false)
    expect(val(matchesCondition)).toBe(false)
    source.set(2)
    expect(val(equalsOne)).toBe(false)
    expect(val(differsFromOne)).toBe(true)
    enabled.set(true)
    expect(val(matchesCondition)).toBe(true)
    source.set(0)
    expect(val(matchesCondition)).toBe(false)
    dispose()
  })
})

test('标识循环的首尾匹配通过 StateView 跟随同一个标识状态', () => {
  createRoot((dispose) => {
    const [ident, operator] = createIdent<'first' | 'last'>('first', { idents: ['first', 'last'] })
    const first = operator.matchFirst()
    const last = operator.matchLast()

    expectTypeOf(first).toEqualTypeOf<StateView<boolean>>()
    expect(val(first)).toBe(true)
    expect(val(last)).toBe(false)
    operator.next()
    expect(val(ident)).toBe('last')
    expect(val(first)).toBe(false)
    expect(val(last)).toBe(true)
    operator.reset()
    expect(val(first)).toBe(true)
    expect(val(last)).toBe(false)
    dispose()
  })
})
