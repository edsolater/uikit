/** 相对 OKLCH 组织工具的独立输入验证。
 *
 * 验证普通来源与通道内容直接组成 CSS，缺失内容不产生结果。
 *
 * 此契约不要求调用方提供 Modification 或 Variable。
 */
import { expect, test } from 'vitest'
import { relativeOKLCH } from './relative-oklch'
import { condition } from '../../../condition'
import { compileRules } from '../../../css-root'

test('普通通道内容无需修改规则即可组织相对颜色，缺失输入不输出', () => {
  const css = compileRules([
    [[condition('.Relative')], 'color', relativeOKLCH('red', 'calc(l + 0.1) c h / alpha')],
    [[condition('.Missing')], 'color', relativeOKLCH('red', undefined)],
  ])
  expect(css).toContain('color: oklch(from red calc(l + 0.1) c h / alpha);')
  expect(css).not.toContain('.Missing')
})
