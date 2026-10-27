/** 验证阴影材料跨主体复用、响应主题，且不预设组件交互。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileCSS } from '../../css-root'
import { rules, type RulesHandle } from '../../rule'
import {
  baseShadowSmall,
  baseShadow,
  baseShadowLarge,
  baseShadowLarger,
  baseShadowLargest,
} from './shadow'

const handles: RulesHandle[] = []
const originalTheme = document.documentElement.dataset.theme

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
  if (originalTheme === undefined) delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = originalTheme
})

test('五档材料供不同主体直接消费，主题改变两者，交互不替组件选择阴影', async () => {
  document.documentElement.dataset.theme = 'light'
  const pairs = [
    baseShadowSmall,
    baseShadow,
    baseShadowLarge,
    baseShadowLarger,
    baseShadowLargest,
  ].map((material, index) => {
    const selector = `.ShadowMaterial${index}`
    handles.push(rules(selector, { 'box-shadow': material }))
    const button = document.body.appendChild(document.createElement('button'))
    const panel = document.body.appendChild(document.createElement('div'))
    button.className = panel.className = selector.slice(1)
    button.textContent = '阴影材料'
    return { button, panel }
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileCSS()
  const light = pairs.map(({ button, panel }) => {
    const value = getComputedStyle(button).boxShadow
    expect(value).not.toBe('none')
    expect(getComputedStyle(panel).boxShadow).toBe(value)
    return value
  })
  for (const [index, { button }] of pairs.entries()) {
    await userEvent.hover(button)
    expect(button.matches(':hover')).toBe(true)
    expect(getComputedStyle(button).boxShadow).toBe(light[index])
    button.disabled = true
    expect(getComputedStyle(button).boxShadow).toBe(light[index])
    await userEvent.unhover(button)
  }
  document.documentElement.dataset.theme = 'dark'
  for (const [index, { button, panel }] of pairs.entries()) {
    const value = getComputedStyle(button).boxShadow
    expect(value).not.toBe(light[index])
    expect(getComputedStyle(panel).boxShadow).toBe(value)
  }
})
