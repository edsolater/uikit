/** 在真实浏览器中验证启动时统一挂载的 Button 样式与核心视觉语义。 */
import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button, type ButtonProps } from './Button'
import { cssRoot, rule, rules, declareVariable, value, whenHover, whenActive, whenDisabled, type RulesHandle } from '../../../style-system'
import { bgColor } from '../../../style-system/values/materials/color-surface'
import { borderRadius } from '../../../style-system/declarations/border'
import { padding } from '../../../style-system/declarations/padding'
import { cornerRadius, smallRadius } from '../../../style-system/values/materials/radius'
import { px8, horizontalPadding, verticalPadding, smallSpace } from '../../../style-system/values/materials/space'

let dispose: (() => void) | undefined
const handles: RulesHandle[] = []
const buttonStyleSelector = 'style#css-root'

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  document.head.querySelectorAll(buttonStyleSelector).forEach((element) => element.remove())
  document.documentElement.removeAttribute('data-theme')
})

describe('Button styles', () => {
  test('所有 variant、tone、size 与 loading 的禁用组合保持各 feature 的覆盖', () => {
    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    cssRoot.mount()

    const variants: ButtonProps['variant'][] = [undefined, 'bare', 'solid']
    const tones: ButtonProps['tone'][] = [undefined, 'accent', 'danger']
    const sizes: ButtonProps['size'][] = [undefined, 'small', 'large', 'xlarge']
    const cases = variants.flatMap(variant => tones.flatMap(tone => sizes.flatMap(size =>
      [false, true].flatMap(loading => ['native', 'status', 'both'].map(mode => ({ variant, tone, size, loading, mode }))))))
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => cases.map((entry, index) => (
      <Button {...entry} disabled htmlProps={{ 'data-testid': `disabled-${index}` }}>禁用</Button>
    )), host)

    const reference = document.body.appendChild(document.createElement('div'))
    reference.style.backgroundColor = 'var(--color-surface)'
    reference.style.color = 'var(--color-fg)'
    const background = getComputedStyle(reference).backgroundColor
    const foreground = getComputedStyle(reference).color
    reference.style.color = 'var(--color-action-fg)'
    const actionForeground = getComputedStyle(reference).color

    for (const [index, entry] of cases.entries()) {
      const button = host.querySelector<HTMLButtonElement>(`[data-testid="disabled-${index}"]`)!
      if (entry.mode === 'native') button.dataset.status = entry.loading ? 'loading' : ''
      if (entry.mode === 'status') button.disabled = false
      button.style.transition = 'none'
      button.style.setProperty('--bg', 'red')
      button.style.setProperty('--fg', 'red')
      button.style.setProperty('--component-shadow', '0 0 10px red')
      expect(button.matches(whenDisabled.header.replace('&', ''))).toBe(true)
      const computed = getComputedStyle(button)
      expect(computed.backgroundColor).toBe(background)
      expect(computed.color).toBe(entry.variant === 'solid' && entry.tone ? actionForeground : foreground)
      expect(computed.boxShadow).toBe('none')
      expect(computed.cursor).toBe('not-allowed')
      expect(computed.opacity).toBe('0.48')
      expect(computed.transform).toBe('none')
      expect(computed.minHeight).toBe(entry.size === 'small' ? '32px' : entry.size === 'large' ? '64px' : entry.size === 'xlarge' ? '80px' : '48px')
    }
  })

  test('disabled 与真实 hover、active 交叠时不进入交互反馈，loading 交集仍显示禁止指针', async () => {
    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    cssRoot.mount()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <>
      <Button loading>启用</Button>
      <Button solid danger loading disabled>禁用</Button>
    </>, host)
    const [enabled, disabledButton] = host.querySelectorAll<HTMLButtonElement>('button')
    enabled.style.transition = 'none'
    disabledButton.style.transition = 'none'
    expect(getComputedStyle(enabled).cursor).toBe('progress')
    enabled.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(enabled.matches(':active')).toBe(true)
      expect(enabled.matches(whenActive.header.replace('&', ''))).toBe(true)
      expect(getComputedStyle(enabled).transform).not.toBe('none')
    } finally { await userEvent.keyboard('[/Space]') }

    // 原生禁用与 UIKit 标记均匹配；移除原生属性后可以真实按下，以验证标记禁用交集。
    const disabledAppearance = () => {
      const computed = getComputedStyle(disabledButton)
      return [computed.backgroundColor, computed.color, computed.boxShadow, computed.cursor, computed.opacity, computed.transform]
    }
    const before = disabledAppearance()
    await userEvent.hover(disabledButton)
    expect(disabledButton.matches(':hover')).toBe(true)
    expect(disabledButton.matches(whenHover.header.replace('&', ''))).toBe(false)
    expect(disabledAppearance()).toEqual(before)
    disabledButton.disabled = false
    disabledButton.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(disabledButton.matches(':active')).toBe(true)
      expect(disabledButton.matches(whenActive.header.replace('&', ''))).toBe(false)
      expect(disabledAppearance()).toEqual(before)
      expect(getComputedStyle(disabledButton).cursor).toBe('not-allowed')
    } finally { await userEvent.keyboard('[/Space]') }
  })

  test('模块导入只登记，应用在首次渲染前统一挂载全部样式', async () => {
    expect(document.head.querySelector(buttonStyleSelector)).toBeNull()

    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    expect(style.sheet!.cssRules).toHaveLength(0)

    handles.push(rules('.shared-input', [
      declareVariable(cornerRadius, smallRadius),
      declareVariable(horizontalPadding, smallSpace),
      declareVariable(verticalPadding, px8),
      borderRadius(cornerRadius),
      padding(verticalPadding, horizontalPadding),
    ]))
    cssRoot.mount()
    const beforeRender = Array.from(style.sheet!.cssRules)
    expect(beforeRender.length).toBeGreaterThan(0)

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
    const afterRender = Array.from(style.sheet!.cssRules)
    expect(afterRender).toHaveLength(beforeRender.length)
    for (let index = 0; index < beforeRender.length; index++) expect(afterRender[index]).toBe(beforeRender[index])
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
    const cssRules = Array.from(style.sheet!.cssRules)
    const cssText = cssRules.map((rule) => rule.cssText).join('\n')
    expect(cssText).toContain('@property --bg')
    expect(cssText).toContain('&:where(:hover)')
    expect(cssText).toContain('&:where(:active)')
    expect(cssText).not.toContain('[object Object]')
    expect(cssRules.filter((rule) => rule instanceof CSSStyleRule && rule.selectorText === '.Button')).toHaveLength(1)
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
    await userEvent.unhover(getButton('default'))

    getButton('default').style.setProperty('--bg', 'rgb(1, 2, 3)')
    expect(getComputedStyle(getButton('default')).backgroundColor).toBe('rgb(1, 2, 3)')
    getButton('default').style.removeProperty('--bg')
    getButton('default').style.setProperty('--bg-when-hover', 'rgb(4, 5, 6)')
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).toBe('rgb(4, 5, 6)')
    await userEvent.unhover(getButton('default'))
    getButton('default').style.removeProperty('--bg-when-hover')
    handles.push(rule('.Button[data-testid="default"]', bgColor, value('rgb(1, 2, 3)', [[whenHover, 'rgb(4, 5, 6)']])))
    cssRoot.mount()
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).toBe('rgb(4, 5, 6)')
    await userEvent.unhover(getButton('default'))
    handles.pop()!.remove()
    cssRoot.mount()

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
    const beforeMount = Array.from(style.sheet!.cssRules)
    cssRoot.mount()
    const afterMount = Array.from(style.sheet!.cssRules)
    expect(afterMount).toHaveLength(beforeMount.length)
    for (let index = 0; index < beforeMount.length; index++) expect(afterMount[index]).toBe(beforeMount[index])
  })
})
