/** 检查按钮配方保持在 JSS 表达边界内。 */
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('按钮配方不手写 CSS 变量引用或提前序列化 JSS 对象', () => {
  const source = readFileSync(new URL('./Button.style.ts', import.meta.url), 'utf8')
  expect(source).not.toMatch(/\bvar\s*\(/)
  expect(source).not.toMatch(/\.toCSSString\s*\(/)
})

test('分类规则不手工展开状态或枚举声量与语气交集', () => {
  const source = readFileSync(new URL('./Button.style.ts', import.meta.url), 'utf8')
  const manualState = /['"](?:hover|active|disabled)['"](?!\s*:)|:(?:hover|active|disabled)\b|when(?:Hover|Active|Disabled)\b|\[data-status[^\]]*disabled/
  expect(source).not.toMatch(manualState)
  expect("variable(1, { states: { 'hover': 2, 'active': 3 } })").not.toMatch(manualState)
  for (const bad of ['rules([...button, \'&:hover\'], effect)', 'const pressed = [...button, whenActive]', 'rules([...button, \'hover\'], effect)']) expect(bad).toMatch(manualState)
  expect(source).not.toMatch(/data-variant[^\n]*data-tone|data-tone[^\n]*data-variant/)
})
