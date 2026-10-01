/** 检查按钮配方保持在 JSS 表达边界内。 */
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('按钮配方不手写 CSS 变量引用或提前序列化 JSS 对象', () => {
  const source = readFileSync(new URL('./Button.style.ts', import.meta.url), 'utf8')
  expect(source).not.toMatch(/\bvar\s*\(/)
  expect(source).not.toMatch(/\.toCSSString\s*\(/)
})
