/** 输入框的真实样式及状态切换。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from '@solidjs/web'
import { cssRoot } from '@/style-system'
import { Input } from './Input'

let dispose: (() => void) | undefined
let host: HTMLElement
let style: HTMLStyleElement

beforeEach(() => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
})

afterEach(() => {
  dispose?.()
  dispose = undefined
  host.remove()
  style.remove()
  delete document.documentElement.dataset.theme
})

test('输入框材料随明暗主题变化', () => {
  dispose = render(() => <Input />, host)
  const input = host.querySelector('input')!
  input.style.transition = 'none'
  document.documentElement.dataset.theme = 'light'
  const light = getComputedStyle(input)
  const lightBackground = light.backgroundColor
  const lightContent = light.color
  document.documentElement.dataset.theme = 'dark'
  expect(getComputedStyle(input).backgroundColor).not.toBe(lightBackground)
  expect(getComputedStyle(input).color).not.toBe(lightContent)
})

test('输入框的焦点、禁用与无效反馈来自已挂载的样式', async () => {
  dispose = render(
    () => (
      <>
        <Input htmlProps={{ placeholder: '请输入' }} />
        <Input invalid />
        <Input htmlProps={{ disabled: true }} />
      </>
    ),
    host,
  )
  const [normal, invalid, disabled] = host.querySelectorAll('input')
  expect(style.textContent).not.toContain('var(--Input-')
  expect(getComputedStyle(normal).minHeight).not.toBe('0px')
  expect(getComputedStyle(disabled).cursor).toBe('not-allowed')
  expect(getComputedStyle(invalid).borderColor).not.toBe(
    getComputedStyle(normal).borderColor,
  )
  expect(getComputedStyle(normal, '::placeholder').color).not.toBe(
    getComputedStyle(normal).color,
  )
  await userEvent.tab()
  expect(document.activeElement).toBe(normal)
  await expect.poll(() => getComputedStyle(normal).boxShadow).not.toBe('none')
  await userEvent.tab()
  expect(document.activeElement).toBe(invalid)
  await expect.poll(() => getComputedStyle(invalid).boxShadow).not.toBe('none')
})

test('无效输入悬停时保留错误边界，普通输入继承调用方的光标', async () => {
  dispose = render(
    () => (
      <div style={{ cursor: 'crosshair' }}>
        <Input type="color" />
        <Input invalid />
      </div>
    ),
    host,
  )
  const [color, invalid] = host.querySelectorAll('input')
  invalid.style.transition = 'none'
  expect(getComputedStyle(color).cursor).toBe('crosshair')
  const invalidBorder = getComputedStyle(invalid).borderColor
  await userEvent.hover(invalid)
  expect(getComputedStyle(invalid).borderColor).toBe(invalidBorder)
})

test('根主题已经生效时局部同名标记不重复套用主题材料', () => {
  document.documentElement.dataset.theme = 'dark'
  dispose = render(
    () => (
      <>
        <Input />
        <Input htmlProps={{ 'data-theme': 'dark' }} />
      </>
    ),
    host,
  )
  const [normal, marked] = host.querySelectorAll('input')
  expect(getComputedStyle(marked).color).toBe(getComputedStyle(normal).color)
})

test('根间距已适配尺寸时输入框不会重复应用根材料的尺寸状态', () => {
  const root = document.documentElement
  const previous = root.getAttribute('data-size')
  root.dataset.size = 'small'
  try {
    dispose = render(
      () => (
        <>
          <Input />
          <Input htmlProps={{ 'data-size': 'small' }} />
        </>
      ),
      host,
    )
    const [normal, marked] = host.querySelectorAll('input')
    expect(getComputedStyle(marked).paddingInline).toBe(
      getComputedStyle(normal).paddingInline,
    )
  } finally {
    if (previous === null) root.removeAttribute('data-size')
    else root.setAttribute('data-size', previous)
  }
})
