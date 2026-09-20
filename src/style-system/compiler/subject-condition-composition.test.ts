/** 状态仅在 Variable 自身与引用链上解析。 */
import { expect, test } from 'vitest'
import { stateCondition } from '../state-conditions'
import { condition } from '../core/css-condition'
import { variable, variableFrom } from '../core/css-variable'
import { resolveRules } from './compile-css'

stateCondition('compositionA', condition('&:where([data-a])'))
stateCondition('compositionB', condition('&:where([data-b])'))

test('状态书写顺序不改变中央优先级', () => {
  const left = variable(1, { name: 'ordered-size', states: { compositionB: 3, compositionA: 2 } })
  const right = variable(1, { name: 'ordered-size', states: { compositionA: 2, compositionB: 3 } })
  expect(resolveRules([[[condition('.Example')], 'width', left]])).toEqual(resolveRules([[[condition('.Example')], 'width', right]]))
})
test('延伸未定义的更高优先级状态仍沿来源链成立', () => {
  const source = variable(1, { name: 'source-size', states: { compositionB: 3 } })
  const next = variableFrom(source, { name: 'next-size', states: { compositionA: 2 } })
  const records = resolveRules([[[condition('.Example')], 'width', next]])
  const definitions = records.filter(([, key]) => key === '--next-size')
  expect(definitions.map(([, , text]) => text)).toEqual(['var(--source-size, 1)', '2', 'var(--source-size, 1)', 'var(--source-size, 1)'])
})
