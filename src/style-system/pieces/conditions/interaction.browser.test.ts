/** 验证交互状态 Condition 的浏览器语义。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileCSS } from '../../css-root'
import { rules, type RulesHandle } from '../../rule'
import {
  whenFocus,
  whenFocusWithin,
  whenHover,
  whenActive,
  whenDisabled,
  whenEnabled,
} from './interaction'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
})

test('hover、active、enabled、disabled 独立匹配并共同影响属性', async () => {
  handles.push(
    rules('.InteractionSubject', {
      'padding-left': '4px',
      'padding-right': '4px',
      'margin-left': '0px',
      'margin-right': '0px',
      'opacity': 1,
    }),
    rules(['.InteractionSubject', whenHover], { 'padding-left': '8px' }),
    rules(['.InteractionSubject', whenEnabled], {
      'padding-right': '8px',
    }),
    rules(['.InteractionSubject', whenActive], {
      'margin-left': '2px',
      'margin-right': '2px',
    }),
    rules(['.InteractionSubject', whenDisabled], { opacity: 0.5 }),
  )
  document.body.appendChild(document.createElement('style')).textContent =
    compileCSS()
  for (const mode of ['native', 'status', 'both']) {
    const button = document.body.appendChild(document.createElement('button'))
    button.className = 'InteractionSubject'
    button.textContent = mode
    button.disabled = mode !== 'status'
    if (mode !== 'native') button.dataset.status = 'loading disabled'
    await userEvent.hover(button)
    expect(button.matches(':hover')).toBe(true)
    expect(getComputedStyle(button).opacity).toBe('0.5')
    expect(getComputedStyle(button).paddingLeft).toBe('8px')
    expect(getComputedStyle(button).paddingRight).toBe('4px')
    button.focus()
    await userEvent.keyboard('[Space>]')
    try {
      if (mode === 'status') {
        expect(button.matches(':active')).toBe(true)
        expect(getComputedStyle(button).marginLeft).toBe('2px')
      }
      expect(getComputedStyle(button).marginRight).toBe(
        mode === 'status' ? '2px' : '0px',
      )
    } finally {
      await userEvent.keyboard('[/Space]')
    }
    button.remove()
  }
})

test('focus 与 focus-within 分别匹配焦点主体和包含主体', () => {
  handles.push(
    rules('.FocusSubject', { 'padding-left': '4px', 'padding-right': '4px' }),
    rules(['.FocusSubject', whenFocus], { 'padding-left': '8px' }),
    rules(['.FocusSubject', whenFocusWithin], { 'padding-right': '12px' }),
  )
  document.body.appendChild(document.createElement('style')).textContent =
    compileCSS()
  const parent = document.body.appendChild(document.createElement('div'))
  const input = parent.appendChild(document.createElement('input'))
  parent.className = input.className = 'FocusSubject'

  input.focus()
  expect(getComputedStyle(input).paddingLeft).toBe('8px')
  expect(getComputedStyle(parent).paddingLeft).toBe('4px')
  expect(getComputedStyle(parent).paddingRight).toBe('12px')
  expect(getComputedStyle(input).paddingRight).toBe('12px')

  input.blur()
  expect(getComputedStyle(parent).paddingRight).toBe('4px')
  expect(getComputedStyle(input).paddingRight).toBe('4px')
  expect(getComputedStyle(input).paddingLeft).toBe('4px')
})
