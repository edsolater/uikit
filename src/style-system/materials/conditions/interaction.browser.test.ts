/** 验证交互状态 Condition 的浏览器语义。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { whenFocus, whenFocusWithin, whenHover, whenActive, whenDisabled } from './interaction'

afterEach(() => document.body.replaceChildren())

test('原生、标记与并存禁用均排除 hover 和 active', async () => {
  for (const mode of ['native', 'status', 'both']) {
    const button = document.body.appendChild(document.createElement('button'))
    button.textContent = mode
    button.disabled = mode !== 'status'
    if (mode !== 'native') button.dataset.status = 'loading disabled'
    await userEvent.hover(button)
    expect(button.matches(':hover')).toBe(true)
    expect(button.matches(whenDisabled.header.replace('&', ''))).toBe(true)
    expect(button.matches(whenHover.header.replace('&', ''))).toBe(false)
    button.focus()
    await userEvent.keyboard('[Space>]')
    try {
      if (mode === 'status') expect(button.matches(':active')).toBe(true)
      expect(button.matches(whenActive.header.replace('&', ''))).toBe(false)
    } finally { await userEvent.keyboard('[/Space]') }
    button.remove()
  }
})

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
