/** 类名数据与原始 CSS 地址保持各自的语义。 */
import { expect, test } from 'vitest'
import { condition, resolveConditionPath } from './condition'
import { compileCSS, compileRules } from './css-root'
import { rules } from './rule'
import { key } from './key'
import { token } from './token'

test('单类地址转义为真实 CSS 类选择器，显式 Condition 保持身份', () => {
  const original = condition('.Item:hover')
  const path = resolveConditionPath([original, '.is:scroll-area'])!
  expect(path[0]).toBe(original)
  expect(path[1]!.header).toBe('.is\\:scroll-area')
})

test('原始 Rules 与按需激活的 Rules 使用相同类名归一', () => {
  const css = compileRules([
    [['.is:raw'], key('color'), 'red'],
    [
      ['.Host'],
      key('background'),
      token('white', {
        onFirstScan: () => [[['.is:activated'], key('color'), 'blue']],
      }),
    ],
  ])
  expect(css).toContain('.is\\:raw')
  expect(css).toContain('.is\\:activated')
  expect(css).not.toContain('[class~=')
})

test('单类地址可嵌套伪元素，显式 Condition 保持伪类语义', () => {
  const first = rules(
    ['@layer is', '.is:scroll-area', '&::-webkit-scrollbar-track'],
    { color: 'red' },
  )
  const second = rules(condition('.Item:hover'), { color: 'blue' })
  try {
    const css = compileCSS()
    expect(css).toContain('.is\\:scroll-area')
    expect(css).not.toContain('[class~=')
    expect(css).toContain('&::-webkit-scrollbar-track')
    expect(css).toContain('.Item:hover')
  } finally {
    first.remove()
    second.remove()
  }
})
