/** 从正式编译结果验证实际引用，不绑定声明位置或去重方式。 */
import { expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { variable } from '../variable'
import { value } from '../value'

test('未实际引用的函数参数不激活', () => {
  const ignored = variable('unused', { name: 'actual-reference-ignored', onActive: () => { throw new Error('未引用对象不应激活') } })
  const select = (_input: typeof ignored) => value(() => 20)
  const fixed = variable(select(ignored), 'actual-reference-fixed')
  const css = compileRules([[['.First'], 'z-index', fixed], [['.Second'], 'z-index', fixed]])
  expect(css).not.toContain('actual-reference-ignored')
})
