/** 在浏览器验证全局智能变量、原生层叠与活 Box 追加的实际效果。 */
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { cssAtom, cssBaseVariable, cssVariable, mountCssStylesheet, selector, stylesheet } from '.'

test('使用只触发全局配方，其他 selector 可消费，局部声明可以覆盖状态', async () => {
  const variable = cssVariable('browser-smart', {
    property: { syntax: '<color>', inherits: true, initialValue: 'blue' },
    value: { default: 'blue', hover: 'green', active: 'red', focusVisible: 'orange' },
  })
  const root = stylesheet(selector('.first', cssAtom.color(variable)))
  expect(document.querySelector('style[data-uikit-css-variables]')).toBeNull()
  const style = mountCssStylesheet(document, 'browser-smart-test', root)

  // 第二使用者没有把变量 attach 到自己的 Box，仍能消费已注册的全局状态。
  const first = document.body.appendChild(document.createElement('button'))
  first.className = 'first'
  first.textContent = '首次使用'
  const second = document.body.appendChild(document.createElement('button'))
  second.textContent = '全局使用'
  second.style.color = 'var(--browser-smart)'
  expect(getComputedStyle(second).color).toBe('rgb(0, 0, 255)')
  await userEvent.hover(second)
  expect(getComputedStyle(second).color).toBe('rgb(0, 128, 0)')
  second.focus()
  await userEvent.keyboard('{Space>}')
  expect(second.matches(':active')).toBe(true)
  expect(second.matches(':focus-visible')).toBe(true)
  // 同权重同时命中时，配方中后写的 focus-visible 自然覆盖 active。
  expect(getComputedStyle(second).color).toBe('rgb(255, 165, 0)')
  await userEvent.keyboard('{/Space}')

  const override = selector('.override', variable.declaration('purple'), cssAtom.color(variable))
  root.attach(override)
  second.className = 'override'
  expect(getComputedStyle(second).color).toBe('rgb(128, 0, 128)')
  expect(style.textContent).toContain('.override')
  expect(style.textContent).not.toContain('&:where')
  expect(document.querySelector('style[data-uikit-css-variables]')?.textContent).toContain(':where(:hover)')

  const appended = cssVariable('browser-appended', { value: 'gold' })
  override.attach(cssAtom.backgroundColor(appended))
  expect(getComputedStyle(second).backgroundColor).toBe('rgb(255, 215, 0)')
  expect(document.querySelectorAll('style[data-uikit-css="browser-smart-test"]')).toHaveLength(1)
  document.body.replaceChildren()
})

test('智能背景通过表面 token 派生，主题及局部覆盖无需业务转换字符串', async () => {
  const root = stylesheet(
    selector('.derived-parent', cssBaseVariable.bg.declaration('pink')),
    selector('.derived', cssAtom.backgroundColor(cssBaseVariable.bg)),
  )
  mountCssStylesheet(document, 'browser-derived-test', root)
  const parent = document.body.appendChild(document.createElement('div'))
  parent.className = 'derived-parent'
  const sentinel = parent.appendChild(document.createElement('button'))
  sentinel.textContent = '对照位置'
  const element = parent.appendChild(document.createElement('button'))
  element.className = 'derived'
  element.textContent = '派生颜色'
  await userEvent.hover(sentinel)
  const defaultColor = getComputedStyle(element).backgroundColor
  expect(defaultColor).toBe('rgb(255, 192, 203)')
  await userEvent.hover(element)
  expect(getComputedStyle(element).backgroundColor).not.toBe(defaultColor)
  document.documentElement.dataset.theme = 'dark'
  const darkColor = getComputedStyle(element).backgroundColor
  delete document.documentElement.dataset.theme
  expect(getComputedStyle(element).backgroundColor).not.toBe(darkColor)
  root.attach(selector('.derived', cssBaseVariable.bg.declaration('pink')))
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 192, 203)')
  document.body.replaceChildren()
})

test('根默认不重置后代，继承与非继承 property 都服从浏览器语义', () => {
  const inherited = cssVariable('browser-inherited', { value: { default: 'blue', hover: 'green' } })
  const independent = cssVariable('browser-independent', {
    property: { syntax: '<color>', inherits: false, initialValue: 'blue' },
    value: 'red',
  })
  const parent = document.body.appendChild(document.createElement('div'))
  parent.className = 'inherit-parent'
  const child = parent.appendChild(document.createElement('span'))
  child.className = 'inherit-child'
  child.textContent = '继承默认'
  mountCssStylesheet(document, 'browser-inherit-test', stylesheet(
    selector('.inherit-parent', inherited.declaration('purple'), independent.declaration('purple')),
    selector('.inherit-child', cssAtom.color(inherited), cssAtom.backgroundColor(independent)),
  ))
  expect(getComputedStyle(child).color).toBe('rgb(128, 0, 128)')
  expect(getComputedStyle(child).backgroundColor).toBe('rgb(0, 0, 255)')
  document.body.replaceChildren()
})
