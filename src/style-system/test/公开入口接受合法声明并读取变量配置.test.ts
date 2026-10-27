/** 公开类型保留目标与内容的关系，并直接提供 Token 创建配置。 */

import { expect, test, vi } from 'vitest'
import { token } from '../index'
import { condition } from '../condition'
import { compileRules } from '../css-root'

test('简写与完整参数在状态顺序相同时生成相同 CSS', () => {
  const shorthand = token(
    { default: 1, active: 3, hover: 2 },
    '--public-shorthand',
  )
  const full = token(1, {
    name: 'public-shorthand',
    state: { active: 3, hover: 2 },
  })
  const compile = (content: typeof shorthand) =>
    compileRules([[[condition('.Shorthand')], 'opacity', content]])
  const css = compile(shorthand)
  expect(css).toBe(compile(full))
  expect(css).toContain('--public-shorthand: 1;')
  expect(css).toContain('--public-shorthand: 2;')
  expect(css).toContain('--public-shorthand: 3;')
  expect(css.indexOf('--public-shorthand: 3;')).toBeLessThan(
    css.indexOf('--public-shorthand: 2;'),
  )
})

test('简写默认生产函数在消费时求值，常量状态独立保留', () => {
  const source = vi.fn(() => 1)
  const amount = token({ default: source, hover: 2 }, 'public-lazy-shorthand')
  expect(source).not.toHaveBeenCalled()
  const css = compileRules([[[condition('.LazyShorthand')], 'opacity', amount]])
  expect(css).toContain('--public-lazy-shorthand: 1;')
  expect(css).toContain('--public-lazy-shorthand: 2;')
  expect(source).toHaveBeenCalled()
})
