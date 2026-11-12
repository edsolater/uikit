/** 在真实浏览器验证类名选择器及嵌套伪元素。 */
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { cssRoot } from '../css-root'
import { rules } from '../rule'
import { token } from '../token'
import '@/components/plugins/is.style'

test('特殊类名只匹配真实类名并支持伪元素', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  const exact = document.body.appendChild(document.createElement('div'))
  const other = document.body.appendChild(document.createElement('div'))
  exact.className = 'is:scroll-area'
  other.className = 'is scroll-area'
  const handles = [
    rules(['@layer is', '.is:scroll-area'], {
      color: 'rgb(1, 2, 3)',
    }),
    rules(['@layer is', '.is:scroll-area', '&::before'], {
      content: '"内容"',
      color: 'rgb(4, 5, 6)',
    }),
  ]
  try {
    cssRoot.mount()
    expect(getComputedStyle(exact).color).toBe('rgb(1, 2, 3)')
    expect(getComputedStyle(other).color).not.toBe('rgb(1, 2, 3)')
    expect(getComputedStyle(exact, '::before').color).toBe('rgb(4, 5, 6)')
  } finally {
    handles.forEach((handle) => handle.remove())
    exact.remove()
    other.remove()
    style.remove()
  }
})

test('实际滚动条伪元素消费 Token 基础值', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'is:scroll-area'
  element.style.width = '120px'
  element.style.height = '60px'
  const content = element.appendChild(document.createElement('div'))
  content.style.height = '600px'
  try {
    cssRoot.mount()
    expect(
      getComputedStyle(element, '::-webkit-scrollbar-thumb').backgroundColor,
    ).toBe('rgba(255, 255, 255, 0.22)')
    expect(style.textContent).toContain('rgb(255 255 255 / 0.34)')
  } finally {
    element.remove()
    style.remove()
  }
})

test('转义类名下的 Token 悬停状态在浏览器生效', async () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'test:hover'
  element.textContent = '悬停'
  const handle = rules('.test:hover', {
    color: token('rgb(1, 2, 3)', {
      name: 'select-class-hover-test',
      state: { hover: 'rgb(4, 5, 6)' },
    }),
  })
  try {
    cssRoot.mount()
    expect(getComputedStyle(element).color).toBe('rgb(1, 2, 3)')
    await userEvent.hover(element)
    await expect
      .poll(() => getComputedStyle(element).color)
      .toBe('rgb(4, 5, 6)')
  } finally {
    handle.remove()
    element.remove()
    style.remove()
  }
})
