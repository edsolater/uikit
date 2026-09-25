/** Value 内容留到编译消费时求值。 */
import { expect, test, vi } from 'vitest'
import { compileRules } from '../compiler/rules'
import { condition } from '../condition'
import { cssContent, value } from '../value'

test('未被消费的动态 Value 不执行，消费后输出内容', () => {
  const serialize = vi.fn(() => 'red')
  const content = value(cssContent(serialize))
  expect(serialize).not.toHaveBeenCalled()
  expect(compileRules([[[condition('.Probe')], 'color', content]])).toContain('color: red;')
  expect(serialize).toHaveBeenCalled()
})
