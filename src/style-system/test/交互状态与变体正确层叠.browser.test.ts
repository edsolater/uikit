/** 验证交互状态经过 Variable、Rule 和浏览器层叠后的表现。 */
import { key } from '../key'
import { variable } from '../variable'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileCSS, rules } from '../index'

afterEach(() => document.body.replaceChildren())

test('hover 与 active 的交集不增加权重压过变体', async () => {
  const base = rules('.interaction-probe', [[key('color'), variable('red', { name: "browser-interaction-color", states: { hover: 'blue', active: 'green' } })]])
  const variant = rules('.interaction-probe[data-variant="solid"]', [[key('color'), 'white']])
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  base.remove()
  variant.remove()
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'interaction-probe'
  button.dataset.variant = 'solid'
  button.textContent = '交互探针'
  await userEvent.hover(button)
  expect(getComputedStyle(button).color).toBe('rgb(255, 255, 255)')
  button.focus()
  await userEvent.keyboard('[Space>]')
  try {
    expect(button.matches(':hover:active')).toBe(true)
    expect(getComputedStyle(button).color).toBe('rgb(255, 255, 255)')
    await userEvent.unhover(button)
    expect(button.matches(':active')).toBe(true)
    expect(getComputedStyle(button).color).toBe('rgb(255, 255, 255)')
  } finally { await userEvent.keyboard('[/Space]') }
})

test('禁用主体呈现禁用颜色，不重新获得悬停或按下颜色', async () => {
  const handle = rules('.disabled-probe', [[key('color'), variable('black', {
    name: 'disabled-probe-color',
    states: { hover: 'blue', active: 'green', disabled: 'gray' },
  })]])
  const style = document.head.appendChild(document.createElement('style'))
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'disabled-probe'
  try {
    style.textContent = compileCSS()
    expect(getComputedStyle(button).color).toBe('rgb(0, 0, 0)')
    button.disabled = true
    await userEvent.hover(button)
    expect(getComputedStyle(button).color).toBe('rgb(128, 128, 128)')
    button.disabled = false
    button.dataset.status = 'disabled'
    expect(getComputedStyle(button).color).toBe('rgb(128, 128, 128)')
  } finally {
    handle.remove()
    style.remove()
    button.remove()
  }
})
