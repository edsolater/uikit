/** 从正式编译结果验证实际引用，不绑定声明位置或去重方式。 */
import { token } from '../token'
import { expect, test } from 'vitest'
import { compileRules } from '../css-root'

test('未实际引用的函数参数不激活', () => {
  const ignored = token('unused', {
    name: 'actual-reference-ignored',
    onFirstScan: () => {
      throw new Error('未引用对象不应激活')
    },
  })
  const select = (_input: typeof ignored) => token(20)
  const fixed = token(select(ignored), 'actual-reference-fixed')
  const css = compileRules([
    [['.First'], 'z-index', fixed],
    [['.Second'], 'z-index', fixed],
  ])
  expect(css).not.toContain('actual-reference-ignored')
})
