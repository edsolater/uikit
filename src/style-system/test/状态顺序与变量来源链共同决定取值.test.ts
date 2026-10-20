/** 状态定义保持中央优先级，可调用内容遵守其公开协议。 */
import { expect, test, vi } from 'vitest'
import { stateCondition } from '../pieces/state-conditions'
import { condition } from '../condition'
import { variable } from '../variable'
import { compileRules } from '../css-root'





stateCondition('compositionA', condition('&:where([data-a])'))
stateCondition('compositionB', condition('&:where([data-b])'))

test('状态书写顺序不改变中央优先级', () => {
  const left = variable(1, { name: 'ordered-size', states: { compositionB: 3, compositionA: 2 } })
  const right = variable(1, { name: 'ordered-size', states: { compositionA: 2, compositionB: 3 } })
  expect(compileRules([[[condition('.Example')], 'width', left]])).toBe(compileRules([[[condition('.Example')], 'width', right]]))
})
test('已求值的可调用默认内容不会在状态缺项时再次调用', () => {
  const content = Object.assign(vi.fn(() => 'wrong'), { toCSSString: () => '10px' })
  const size = variable(() => content, { name: 'callable-default-size', states: { compositionA: '20px' } })
  const css = compileRules([[[condition('.Example')], 'width', size]])
  expect(css).toContain('--callable-default-size: 10px;')
  expect(content).not.toHaveBeenCalled()
})
