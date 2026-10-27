/** 可调用内容遵守自身输出协议，不因状态缺项而重复执行。 */
import { stateCondition } from '../state-condition'
import { token } from '../token'
import { expect, test, vi } from 'vitest'

import { condition } from '../condition'
import { compileRules } from '../css-root'

const compositionA = stateCondition('&:where([data-a])')
test('已求值的可调用默认内容不会在状态缺项时再次调用', () => {
  const content = Object.assign(
    vi.fn(() => 'wrong'),
    { toCSSString: () => '10px' },
  )
  const size = token(() => content, {
    name: 'callable-default-size',
    state: [[compositionA, '20px']],
  })
  const css = compileRules([[[condition('.Example')], 'width', size]])
  expect(css).toContain('--callable-default-size: 10px;')
  expect(content).not.toHaveBeenCalled()
})
