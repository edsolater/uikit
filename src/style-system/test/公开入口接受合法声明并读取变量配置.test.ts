/** 公开类型保留目标与内容的关系，并直接提供 Token 创建配置。 */

import { expect, test, vi } from 'vitest'
import { token } from '../index'
import { condition } from '../condition'
import { compileRules } from '../css-root'

test('显式名称有无双连字符前缀时生成相同 CSS，保留状态顺序', () => {
  const shorthand = token(1, {
    name: '--public-shorthand',
    state: { active: 3, hover: 2 },
  })
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

test('默认生产函数在消费时求值，常量状态独立保留', () => {
  const source = vi.fn(() => 1)
  const amount = token(source, {
    name: 'public-lazy-shorthand',
    state: { hover: 2 },
  })
  expect(source).not.toHaveBeenCalled()
  const css = compileRules([[[condition('.LazyShorthand')], 'opacity', amount]])
  expect(css).toContain('--public-lazy-shorthand: 1;')
  expect(css).toContain('--public-lazy-shorthand: 2;')
  expect(source).toHaveBeenCalled()
})
