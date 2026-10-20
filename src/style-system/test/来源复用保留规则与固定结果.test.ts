/** 来源：variableFrom 复用复杂定义，业务仅替换基础或指定差异。 */
import { expect, test } from 'vitest'
import { variable, variableFrom } from '../index'
import { compileRules } from '../css-root'
import { multiply } from '../pieces/contents/functions/calc'

test('替换基础后继承状态规则和固定状态，来源保持原结果', () => {
  const source = variable('4px', {
    name: 'from-source', states: { hover: base => multiply(base, 2), active: '12px' },
    variants: { wide: base => multiply(base, 3), fixed: '5px' },
  })
  const result = variableFrom(source, '7px', name => `next-${name}`)
  const css = compileRules([[['.Source'], 'width', source], [['.Next'], 'width', result],
    [['.Wide'], 'width', result.variant('wide')], [['.Fixed'], 'width', result.variant('fixed')]])
  expect(css).toContain('--from-source: 4px;')
  expect(css).toContain('--next-from-source: 7px;')
  expect(css).toContain('--next-from-source: calc(7px * 2);')
  expect(css).toContain('--next-from-source: 12px;')
  expect(css).toContain('--next-from-source-wide: calc(7px * 3);')
  expect(css).toContain('--next-from-source-fixed: 5px;')
})

test('名称省略沿用来源，显式等级零与状态覆盖均有效', () => {
  const source = variable(4, { name: 'from-inherit', priority: 3, states: { hover: 8, active: 12 } })
  const sameName = variableFrom(source, 7)
  expect(sameName.name).toBe(source.name)
  expect(sameName.priority).toBe(4)
  const overridden = variableFrom(source, 0, { name: 'from-zero', priority: 0, states: { hover: 20 } })
  expect(overridden.priority).toBe(0)
  const css = compileRules([[['.Zero'], 'width', overridden]])
  expect(css).toContain('--from-zero: 0;')
  expect(css).toContain('--from-zero: 20;')
  expect(css).toContain('--from-zero: 12;')
})

test('变体结果可继续复用，不重新取得已经消去的变体', () => {
  const source = variable(4, { name: 'from-variant', variants: { line: 5 } })
  const result = variableFrom(source.variant('line'), 9, 'from-line')
  expect(compileRules([[['.Line'], 'width', result]])).toContain('--from-line: 9;')
  expect(() => result.variant('line')).toThrow()
})
