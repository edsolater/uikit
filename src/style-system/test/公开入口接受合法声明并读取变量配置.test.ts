/** 公开类型保留目标与内容的关系，并直接提供 Variable 创建配置。 */

import { expect, test, vi } from 'vitest'
import { variable } from '../index'
import { condition } from '../condition'
import { compileRules } from '../css-root'

test('简写与完整参数生成同样的 CSS 并保留状态优先级', () => {
  const shorthand = variable({ default: 1, active: 3, hover: 2 }, '--public-shorthand')
  const full = variable(1, { name: 'public-shorthand', states: { hover: 2, active: 3 } })
  const compile = (content: typeof shorthand) => compileRules([[[condition('.Shorthand')], 'opacity', content]])
  const css = compile(shorthand)
  expect(css).toBe(compile(full))
  expect(css).toContain('--public-shorthand: 1;')
  expect(css).toContain('--public-shorthand: 2;')
  expect(css).toContain('--public-shorthand: 3;')
  expect(css.indexOf('--public-shorthand: 2;')).toBeLessThan(css.indexOf('--public-shorthand: 3;'))
})

test('简写默认生产函数在消费时求值，常量状态独立保留', () => {
  const source = vi.fn(() => 1)
  const amount = variable({ default: source, hover: 2 }, 'public-lazy-shorthand')
  expect(source).not.toHaveBeenCalled()
  const css = compileRules([[[condition('.LazyShorthand')], 'opacity', amount]])
  expect(css).toContain('--public-lazy-shorthand: 1;')
  expect(css).toContain('--public-lazy-shorthand: 2;')
  expect(source).toHaveBeenCalled()
})
