/** 原生控件样式由 Style System 统一登记与挂载。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { cssRoot } from '../index'
import '../pieces/native-controls.style'

afterEach(() => {
  document.getElementById('css-root')?.remove()
  document.body.replaceChildren()
  delete document.documentElement.dataset.theme
})

test('裸控件的输入、焦点、禁用、选项和弹窗样式由挂载结果提供', async () => {
  const sheet = document.head.appendChild(document.createElement('style'))
  sheet.id = 'css-root'
  cssRoot.mount()
  document.body.innerHTML =
    '<input placeholder="请输入"><button>确认</button><button disabled>禁用</button><select><option selected>选项</option></select><dialog>内容</dialog>'
  const input = document.querySelector('input')!
  const [button, disabled] = document.querySelectorAll('button')
  const select = document.querySelector('select')!
  const dialog = document.querySelector('dialog')!
  expect(sheet.textContent).toContain('@layer controls')
  expect(sheet.textContent).not.toContain('var(--widget-')
  expect(getComputedStyle(input).borderRadius).toBe('8px')
  expect(getComputedStyle(button).cursor).toBe('pointer')
  expect(getComputedStyle(disabled).cursor).toBe('not-allowed')
  expect(Number(getComputedStyle(disabled).opacity)).toBeCloseTo(0.56)
  expect(getComputedStyle(dialog).borderRadius).toBe('12px')
  await userEvent.tab()
  expect(document.activeElement).toBe(input)
  expect(getComputedStyle(input).outlineStyle).toBe('solid')
  if (CSS.supports('appearance', 'base-select')) {
    expect(getComputedStyle(select).appearance).toBe('base-select')
    expect(getComputedStyle(select, '::picker(select)').appearance).toBe(
      'base-select',
    )
  }
})
