/** 在真实浏览器中验证启动时统一挂载的 Button 样式与核心视觉语义。 */
import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button, type ButtonProps } from './Button'
import { cssRoot, rule, rules, value, type RulesHandle } from '../../../style-system'
import { whenHover, whenActive, whenDisabled } from '../../../style-system/selectors/interaction'
import { $borderRadius } from '../../../style-system/properties/border'
import { $backgroundColor } from '../../../style-system/properties/color'
import { contentLayout } from '../../../style-system/mixins/content'
import { subtle } from '../../../style-system/values/materials/radius'
import { smallSpace } from '../../../style-system/values/materials/space'

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
    reference.style.color = 'var(--color-foreground)'
    const background = getComputedStyle(reference).backgroundColor
    const foreground = getComputedStyle(reference).color
    reference.style.color = 'var(--color-action-foreground)'
    const actionForeground = getComputedStyle(reference).color

    for (const [index, entry] of cases.entries()) {
      const button = host.querySelector<HTMLButtonElement>(`[data-testid="disabled-${index}"]`)!
      if (entry.mode === 'native') button.dataset.status = entry.loading ? 'loading' : ''
      if (entry.mode === 'status') button.disabled = false
      button.style.transition = 'none'
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

  test('focus-visible 建立完整边界，danger 只覆盖颜色', async () => {
    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    cssRoot.mount()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <>
      <Button htmlProps={{ 'data-testid': 'focus-default' }}>默认</Button>
      <Button danger htmlProps={{ 'data-testid': 'focus-danger' }}>危险</Button>
    </>, host)
    const defaultButton = host.querySelector<HTMLButtonElement>('[data-testid="focus-default"]')!
    const dangerButton = host.querySelector<HTMLButtonElement>('[data-testid="focus-danger"]')!
    const reference = document.body.appendChild(document.createElement('div'))
    reference.style.color = 'var(--color-accent-focus)'
    const accentColor = getComputedStyle(reference).color
    reference.style.color = 'var(--color-danger-line)'
    const dangerColor = getComputedStyle(reference).color

    await userEvent.tab()
    expect(document.activeElement).toBe(defaultButton)
    expect(defaultButton.matches(':focus-visible')).toBe(true)
    const defaultStyle = getComputedStyle(defaultButton)
    expect(defaultStyle.outlineWidth).toBe('2px')
    expect(defaultStyle.outlineStyle).toBe('solid')
    expect(defaultStyle.outlineOffset).toBe('2px')
    expect(defaultStyle.outlineColor).toBe(accentColor)

    await userEvent.tab()
    expect(document.activeElement).toBe(dangerButton)
    expect(dangerButton.matches(':focus-visible')).toBe(true)
    const dangerStyle = getComputedStyle(dangerButton)
    expect(dangerStyle.outlineWidth).toBe('2px')
    expect(dangerStyle.outlineStyle).toBe('solid')
    expect(dangerStyle.outlineOffset).toBe('2px')
    expect(dangerStyle.outlineColor).toBe(dangerColor)
  })

  test('模块导入只登记，应用在首次渲染前统一挂载全部样式', async () => {
    expect(document.head.querySelector(buttonStyleSelector)).toBeNull()

    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    expect(style.sheet!.cssRules).toHaveLength(0)

    handles.push(rules('.shared-input', [
      [$borderRadius, subtle],
      contentLayout({ padding: ['8px', smallSpace] }),
    ]))
    cssRoot.mount()
    const beforeRender = Array.from(style.sheet!.cssRules)
    expect(beforeRender.length).toBeGreaterThan(0)

    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button htmlProps={{ 'data-testid': 'default' }}>
            <span>Default</span>
            <span>Action</span>
          </Button>
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
    const defaultButton = getButton('default')
    defaultButton.style.width = '240px'
    const defaultStyle = getComputedStyle(defaultButton)
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
    expect(cssText).toContain('&:where(:hover)')
    expect(cssText).toContain('&:where(:active)')
    expect(cssText).not.toContain('[object Object]')
    expect(cssRules.filter((rule) => rule instanceof CSSStyleRule && rule.selectorText === '.Button')).toHaveLength(1)
    expect(document.head.querySelectorAll(buttonStyleSelector)).toHaveLength(1)
    const [firstContent, secondContent] = defaultButton.querySelectorAll<HTMLElement>('span')
    const buttonRect = defaultButton.getBoundingClientRect()
    const firstRect = firstContent.getBoundingClientRect()
    const secondRect = secondContent.getBoundingClientRect()
    expect(secondRect.left).toBeGreaterThan(firstRect.right)
    expect(secondRect.left - firstRect.right).toBeCloseTo(8, 0)
    expect((firstRect.left + secondRect.right) / 2).toBeCloseTo((buttonRect.left + buttonRect.right) / 2, 0)
    expect((firstRect.top + firstRect.bottom) / 2).toBeCloseTo((buttonRect.top + buttonRect.bottom) / 2, 0)
    expect((secondRect.top + secondRect.bottom) / 2).toBeCloseTo((buttonRect.top + buttonRect.bottom) / 2, 0)
    expect(defaultStyle.minHeight).toBe('48px')
    expect(defaultStyle.fontSize).toBe('16px')
    expect(defaultStyle.paddingTop).toBe('8px')
    expect(defaultStyle.paddingLeft).toBe('24px')
    expect(defaultStyle.borderTopWidth).toBe('1px')
    expect(defaultStyle.borderTopStyle).toBe('solid')
    expect(solidStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(bareStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(accentStyle.backgroundColor).not.toBe(dangerStyle.backgroundColor)
    expect(Number.parseFloat(xlargeStyle.minHeight)).toBeGreaterThan(Number.parseFloat(smallStyle.minHeight))
    expect(smallStyle.minHeight).toBe('32px')
    expect(smallStyle.fontSize).toBe('14px')
    expect(smallStyle.columnGap).toBe('4px')
    const largeStyle = getComputedStyle(getButton('large'))
    expect(largeStyle.minHeight).toBe('64px')
    expect(largeStyle.fontSize).toBe('20px')
    expect(largeStyle.columnGap).toBe('12px')
    expect(xlargeStyle.minHeight).toBe('80px')
    expect(xlargeStyle.fontSize).toBe('24px')
    expect(xlargeStyle.columnGap).toBe('16px')
    expect(getComputedStyle(getButton('loading')).cursor).toBe('progress')
    expect(disabledStyle.cursor).toBe('not-allowed')
    expect(disabledStyle.opacity).toBe('0.48')

    const defaultBackground = defaultStyle.backgroundColor
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).not.toBe(defaultBackground)
    await userEvent.unhover(getButton('default'))

    handles.push(rule('.Button[data-testid="default"]', $backgroundColor, value('rgb(1, 2, 3)', [['hover', 'rgb(4, 5, 6)']])))
    cssRoot.mount()
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).toBe('rgb(4, 5, 6)')
    await userEvent.unhover(getButton('default'))
    handles.pop()!.remove()
    cssRoot.mount()

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
