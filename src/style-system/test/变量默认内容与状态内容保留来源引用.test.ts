/** Variable 的 CSS 引用编译契约。
 *
 * 验证普通默认值、嵌套 Variable 和状态内容遵循相同的引用规则。
 *
 * 即使显示颜色恰好相同，来源被替换为定义内容也必须使测试失败。
 */
import { expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { variable } from '../variable'

test('普通默认内容作为自身 CSS 引用的 fallback', () => {
  const paperColor = variable('white', 'contract-paper-color')
  const css = compileRules([[['.Paper'], 'color', paperColor]])

  expect(css).toMatch(/color:\s*var\(\s*--contract-paper-color\s*,\s*white\s*\)\s*;/)
})

test('默认内容是另一 Variable 时保留两层引用及其 fallback', () => {
  const paperColor = variable('white', 'contract-paper-color')
  const canvasColor = variable(paperColor, 'contract-canvas-color')
  const css = compileRules([[['.Canvas'], 'background-color', canvasColor]])

  expect(css).toMatch(/background-color:\s*var\(\s*--contract-canvas-color\s*,\s*var\(\s*--contract-paper-color\s*,\s*white\s*\)\s*\)\s*;/)
})

test.each([false, true])('状态内容保留来源引用，不替换为来源定义；来源有自身状态：%s', (sourceHasState) => {
  const paperColor = variable('white', {
    name: 'contract-paper-color',
    states: sourceHasState ? { hover: 'black' } : undefined,
  })
  const canvasColor = variable('gray', {
    name: 'contract-canvas-color',
    states: { hover: paperColor },
  })
  const css = compileRules([[['.Canvas'], 'background-color', canvasColor]])

  expect(css).toMatch(/--contract-canvas-color:\s*var\(\s*--contract-paper-color\s*,\s*white\s*\)\s*;/)
  expect(css).not.toMatch(/--contract-canvas-color:\s*(?:white|black)\s*;/)
})
