/** 验证交互状态 Condition 的浏览器语义。 */
import { afterEach, expect, test } from 'vitest'
import { whenFocus, whenFocusWithin } from './interaction'

afterEach(() => document.body.replaceChildren())

test('focus 与 focus-within 分别匹配焦点主体和包含主体', () => {
  const parent = document.body.appendChild(document.createElement('div'))
  const input = parent.appendChild(document.createElement('input'))

  input.focus()
  expect(input.matches(whenFocus.header.replace('&', ''))).toBe(true)
  expect(parent.matches(whenFocus.header.replace('&', ''))).toBe(false)
  expect(parent.matches(whenFocusWithin.header.replace('&', ''))).toBe(true)

  input.blur()
  expect(parent.matches(whenFocusWithin.header.replace('&', ''))).toBe(false)
})
