/** 在真实浏览器中验证 Button 的按需样式与核心视觉语义。 */
import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button } from './Button'
import { registerButtonStyle } from './Button.style'
import { cssRoot, styleRule, declareVariable } from '../../../style-system'
import { borderRadius } from '../../../style-system/css-properties/border'
import { padding } from '../../../style-system/css-properties/padding'
import { cornerRadius } from '../../../style-system/css-values/appearance'
import { smallRadius, px8 } from '../../../style-system/css-values/dimension-scale'
import { horizontalPadding, verticalPadding } from '../../../style-system/css-values/dimension-spacing'
import { smallSpace } from '../../../style-system/css-values/dimension-theme'

let dispose: (() => void) | undefined
const buttonStyleSelector = 'style#css-root'

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  document.head.querySelectorAll(buttonStyleSelector).forEach((element) => element.remove())
  document.documentElement.removeAttribute('data-theme')
})

describe('Button styles', () => {
  test('只 import 不挂载，首次渲染后各语义与状态形成真实样式', async () => {
    expect(document.head.querySelector(buttonStyleSelector)).toBeNull()

    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    expect(style.sheet!.cssRules).toHaveLength(0)

    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button htmlProps={{ 'data-testid': 'default' }}>Default</Button>
          <Button solid htmlProps={{ 'data-testid': 'solid' }}>
            Solid
          </Button>
          <Button bare htmlProps={{ 'data-testid': 'bare' }}>
            Bare
          </Button>
          <Button solid accent htmlProps={{ 'data-testid': 'accent' }}>
            Accent
          </Button>
          <Button solid danger htmlProps={{ 'data-testid': 'danger' }}>
            Danger
          </Button>
          <Button small htmlProps={{ 'data-testid': 'small' }}>
            Small
          </Button>
          <Button large htmlProps={{ 'data-testid': 'large' }}>
            Large
          </Button>
          <Button xlarge htmlProps={{ 'data-testid': 'xlarge' }}>
            XLarge
          </Button>
          <Button loading htmlProps={{ 'data-testid': 'loading' }}>
            Loading
          </Button>
          <Button disabled htmlProps={{ 'data-testid': 'disabled' }}>
            Disabled
          </Button>
        </>
      ),
      host,
    )

    const getButton = (name: string) => document.querySelector<HTMLElement>(`[data-testid="${name}"]`)!
    const input = document.createElement('input')
    input.className = 'shared-input'
    host.append(input)
    cssRoot.activate(
      styleRule('.shared-input').attach(
        declareVariable(cornerRadius, smallRadius),
        declareVariable(horizontalPadding, smallSpace),
        declareVariable(verticalPadding, px8),
        borderRadius(cornerRadius),
        padding(verticalPadding, horizontalPadding),
      ),
    )
    expect(getComputedStyle(input).borderTopLeftRadius).toBe('4px')
    expect(getComputedStyle(getButton('default')).borderTopLeftRadius).toBe('999px')
    expect(getComputedStyle(input).paddingLeft).toBe('4px')
    expect(getComputedStyle(input).paddingTop).toBe('8px')
    host.querySelectorAll<HTMLElement>('button').forEach((button) => {
      button.style.transition = 'none'
    })
    const defaultStyle = getComputedStyle(getButton('default'))
    const solidStyle = getComputedStyle(getButton('solid'))
    const bareStyle = getComputedStyle(getButton('bare'))
    const accentStyle = getComputedStyle(getButton('accent'))
    const dangerStyle = getComputedStyle(getButton('danger'))
    const smallStyle = getComputedStyle(getButton('small'))
    const xlargeStyle = getComputedStyle(getButton('xlarge'))
    const disabledStyle = getComputedStyle(getButton('disabled'))

    expect(style).not.toBeNull()
    const rules = Array.from(style.sheet!.cssRules)
    const cssText = rules.map((rule) => rule.cssText).join('\n')
    expect(cssText).toContain('@property --bg')
    expect(cssText).toContain('&:where(:hover)')
    expect(cssText).toContain('&:where(:active)')
    expect(cssText).not.toContain('[object Object]')
    expect(rules.filter((rule) => rule instanceof CSSStyleRule && rule.selectorText === '.Button')).toHaveLength(1)
    expect(document.head.querySelectorAll(buttonStyleSelector)).toHaveLength(1)
    expect(defaultStyle.display).toBe('inline-flex')
    expect(defaultStyle.minHeight).toBe('48px')
    expect(defaultStyle.paddingTop).toBe('8px')
    expect(defaultStyle.paddingLeft).toBe('24px')
    expect(defaultStyle.borderTopWidth).toBe('1px')
    expect(defaultStyle.borderTopStyle).toBe('solid')
    expect(solidStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(bareStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(accentStyle.backgroundColor).not.toBe(dangerStyle.backgroundColor)
    expect(Number.parseFloat(xlargeStyle.minHeight)).toBeGreaterThan(Number.parseFloat(smallStyle.minHeight))
    expect(smallStyle.minHeight).toBe('32px')
    expect(getComputedStyle(getButton('large')).minHeight).toBe('64px')
    expect(xlargeStyle.minHeight).toBe('80px')
    expect(getComputedStyle(getButton('loading')).cursor).toBe('progress')
    expect(disabledStyle.cursor).toBe('not-allowed')
    expect(disabledStyle.opacity).toBe('0.48')

    const defaultBackground = defaultStyle.backgroundColor
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).not.toBe(defaultBackground)

    getButton('default').style.setProperty('--bg', 'rgb(1, 2, 3)')
    expect(getComputedStyle(getButton('default')).backgroundColor).toBe('rgb(1, 2, 3)')
    getButton('default').style.setProperty('--bg-hover', 'rgb(4, 5, 6)')
    expect(getComputedStyle(getButton('default')).backgroundColor).toBe('rgb(4, 5, 6)')
    getButton('default').style.removeProperty('--bg')
    getButton('default').style.removeProperty('--bg-hover')

    getButton('default').style.setProperty('--component-padding-x', '31px')
    getButton('default').style.setProperty('--component-gap', '9px')
    expect(getComputedStyle(getButton('default')).paddingLeft).toBe('31px')
    expect(getComputedStyle(getButton('default')).gap).toBe('9px')
    expect(getComputedStyle(input).paddingLeft).toBe('4px')

    await userEvent.tab()
    const focused = document.activeElement as HTMLElement
    expect(focused.matches('button:focus-visible')).toBe(true)
    expect(getComputedStyle(focused).outlineStyle).toBe('solid')
    expect(getComputedStyle(focused).outlineWidth).toBe('2px')

    const disabledButton = getButton('disabled')
    disabledButton.style.transition = 'none'
    const disabledBackground = getComputedStyle(disabledButton).backgroundColor
    await userEvent.hover(disabledButton)
    expect(getComputedStyle(disabledButton).backgroundColor).toBe(disabledBackground)

    const lightBackground = getComputedStyle(getButton('default')).backgroundColor
    document.documentElement.dataset.theme = 'dark'
    expect(getComputedStyle(getButton('default')).backgroundColor).not.toBe(lightBackground)
    registerButtonStyle()
    expect(Array.from(style.sheet!.cssRules)).toEqual(rules)
  })
})
