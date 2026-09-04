/** 在真实浏览器中验证 Button 的按需样式与核心视觉语义。 */
import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import '../../../css/all-base.css'
import { Button } from './Button'
import { buttonStyleURL } from './Button.style'

let dispose: (() => void) | undefined
const buttonStyleSelector = 'style[data-uikit-css="' + buttonStyleURL + '"]'

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  document.head.querySelectorAll(buttonStyleSelector).forEach((element) => element.remove())
})

describe('Button styles', () => {
  test('只 import 不挂载，首次渲染后各语义形成可区分的真实样式', () => {
    expect(document.head.querySelector(buttonStyleSelector)).toBeNull()

    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button htmlProps={{ 'data-testid': 'default' }}>Default</Button>
          <Button solid htmlProps={{ 'data-testid': 'solid' }}>Solid</Button>
          <Button bare htmlProps={{ 'data-testid': 'bare' }}>Bare</Button>
          <Button solid accent htmlProps={{ 'data-testid': 'accent' }}>Accent</Button>
          <Button solid danger htmlProps={{ 'data-testid': 'danger' }}>Danger</Button>
          <Button small htmlProps={{ 'data-testid': 'small' }}>Small</Button>
          <Button xlarge htmlProps={{ 'data-testid': 'xlarge' }}>XLarge</Button>
          <Button disabled htmlProps={{ 'data-testid': 'disabled' }}>Disabled</Button>
        </>
      ),
      host,
    )

    const style = document.head.querySelector(buttonStyleSelector)
    /** 取得当前用例中一个带测试身份的按钮。 */
    const getButton = (name: string) => document.querySelector<HTMLElement>(`[data-testid="${name}"]`)!
    const defaultStyle = getComputedStyle(getButton('default'))
    const solidStyle = getComputedStyle(getButton('solid'))
    const bareStyle = getComputedStyle(getButton('bare'))
    const accentStyle = getComputedStyle(getButton('accent'))
    const dangerStyle = getComputedStyle(getButton('danger'))
    const smallStyle = getComputedStyle(getButton('small'))
    const xlargeStyle = getComputedStyle(getButton('xlarge'))
    const disabledStyle = getComputedStyle(getButton('disabled'))

    expect(style).not.toBeNull()
    expect(document.head.querySelectorAll(buttonStyleSelector)).toHaveLength(1)
    expect(defaultStyle.display).toBe('inline-flex')
    expect(solidStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(bareStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(accentStyle.backgroundColor).not.toBe(dangerStyle.backgroundColor)
    expect(Number.parseFloat(xlargeStyle.minHeight)).toBeGreaterThan(Number.parseFloat(smallStyle.minHeight))
    expect(disabledStyle.cursor).toBe('not-allowed')
    expect(disabledStyle.opacity).toBe('0.48')
  })
})
