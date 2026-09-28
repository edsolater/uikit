/** 状态由 Variable 自身与 Cluster 成员继承共同决定。 */
import { expect, test } from 'vitest'
import { stateCondition } from '../pieces/state-conditions'
import { condition } from '../condition'
import { variable } from '../variable'
import { clusterFrom, variableCluster } from '../variable-cluster'
import { compileRules } from '../css-root'

stateCondition('compositionA', condition('&:where([data-a])'))
stateCondition('compositionB', condition('&:where([data-b])'))

test('状态书写顺序不改变中央优先级', () => {
  const left = variable(1, { name: 'ordered-size', states: { compositionB: 3, compositionA: 2 } })
  const right = variable(1, { name: 'ordered-size', states: { compositionA: 2, compositionB: 3 } })
  expect(compileRules([[[condition('.Example')], 'width', left]])).toBe(compileRules([[[condition('.Example')], 'width', right]]))
})
test('Cluster 成员未覆盖的更高优先级状态仍沿来源成立', () => {
  const source = variable(1, { name: 'source-size', states: { compositionB: 3 } })
  const next = clusterFrom(variableCluster({ default: source, extra: variable(4, { name: 'source-extra-size' }) }), {
    default: { name: 'next-size', states: { compositionA: 2 } },
    extra: { name: 'next-extra-size' },
  })
  const css = compileRules([[[condition('.Example')], 'width', next]])
  expect(css).toContain('--next-size: 2;')
  expect(css).toContain('--next-size: var(--source-size, 1);')
})
