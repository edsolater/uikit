/** 在真实浏览器中验证启动时统一挂载的 Button 样式与核心视觉语义。 */
import '../../../css/all-base.css'
import { render } from 'solid-js/web'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button, type ButtonProps } from './Button'
import { cssRoot, rule, rules, value, type RulesHandle } from '../../../style-system'
import { whenHover, whenActive, whenDisabled } from '../../../style-system/selectors/interaction'
import { $borderRadius } from '../../../style-system/properties/border'
import { $backgroundColor } from '../../../style-system/properties/color'
import { contentLayout } from '../../../style-system/mixins/content'
import { subtle } from '../../../style-system/values/materials/radius'
import { smallSpace } from '../../../style-system/values/materials/space'
import './Button.style'
import baselineCSS from './Button.css?raw'
import { action, actionHover, actionActive, actionForeground, actionLine } from '../../../style-system/values/materials/color/action'
import { foreground, strongForeground } from '../../../style-system/values/materials/color/text'
import { accent, softAccent, strongAccent, accentForeground, accentFocus, danger, softDanger, dangerForeground, dangerLine } from '../../../style-system/values/materials/color/tone'
import { flat, low, raised, elevated } from '../../../style-system/values/materials/shadow'
import '../../../components/kits/Input/Input.css'
import '../../../components/kits/Popover/popover.css'

let dispose: (() => void) | undefined
const handles: RulesHandle[] = []
const buttonStyleSelector = 'style#css-root'

/** 模拟应用在渲染前提供挂载点并提交已登记样式。 */
function mountButtonStyles() {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  return style
}

beforeEach(() => {
  // 入口切换前也只让 TS 命中 Button；原文件仅改类名后作为独立对照。
  document.head.querySelectorAll<HTMLStyleElement>('style[data-vite-dev-id]').forEach(style => {
    if (style.dataset.viteDevId?.replaceAll('\\', '/').endsWith('/Button.css')) style.sheet!.disabled = true
  })
  const baseline = document.body.appendChild(document.createElement('style'))
  baseline.textContent = baselineCSS.replaceAll('.Button', '.BaselineButton')
})

/** 读取主体外观；不比较历史边缘场景中已明确调整的焦点环。 */
function appearance(button: HTMLElement) {
  const style = getComputedStyle(button)
  return Object.fromEntries(['background-color', 'color', 'border-top-color', 'box-shadow', 'opacity', 'transform'].map(key => [key, style.getPropertyValue(key)]))
}

/** 旧 CSS 对照只改变样式身份，保留组件生成的属性与内容。 */
function baselineButton(button: HTMLButtonElement) {
  const baseline = button.cloneNode(true) as HTMLButtonElement
  baseline.classList.replace('Button', 'BaselineButton')
  button.parentElement!.append(baseline)
  baseline.style.transition = 'none'
  return baseline
}

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  document.head.querySelectorAll(buttonStyleSelector).forEach((element) => element.remove())
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.style.removeProperty('--base-brand')
})

describe('Button styles', () => {
  test('旧 CSS 固定为 9 月 3 日迁移前的 Git blob', async () => {
    const content = new TextEncoder().encode(baselineCSS)
    const header = new TextEncoder().encode(`blob ${content.length}\0`)
    const blob = new Uint8Array(header.length + content.length)
    blob.set(header)
    blob.set(content, header.length)
    const digest = await crypto.subtle.digest('SHA-1', blob)
    expect(Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')).toBe('dab69febec84ce8d9e38921c33e2a5de16a8568a')
  })
  for (const theme of ['light', 'dark']) {
    test(`${theme}：九种配方的常态、悬停和两种 active 交集与旧 CSS 一致`, async () => {
      document.documentElement.dataset.theme = theme
      mountButtonStyles()
      const host = document.body.appendChild(document.createElement('div'))
      const variants: ButtonProps['variant'][] = [undefined, 'bare', 'solid']
      const tones: ButtonProps['tone'][] = [undefined, 'accent', 'danger']
      dispose = render(() => variants.flatMap(variant => tones.map(tone => <Button variant={variant} tone={tone}>比较</Button>)), host)
      for (const button of Array.from(host.querySelectorAll<HTMLButtonElement>('button'))) {
        button.style.transition = 'none'
        const baseline = baselineButton(button)
        expect(appearance(button)).toEqual(appearance(baseline))
        await userEvent.hover(baseline)
        const hover = appearance(baseline)
        baseline.focus()
        await userEvent.keyboard('[Space>]')
        const active = appearance(baseline)
        const ring = ['outline-width', 'outline-style', 'outline-color', 'outline-offset'].map(property => getComputedStyle(baseline).getPropertyValue(property))
        await userEvent.keyboard('[/Space]')
        await userEvent.hover(button)
        expect(appearance(button)).toEqual(hover)
        button.focus()
        await userEvent.keyboard('[Space>]')
        try {
          expect(button.matches(':hover:active')).toBe(true)
          expect(appearance(button)).toEqual(active)
          expect(button.matches(':focus-visible')).toBe(true)
          expect(['outline-width', 'outline-style', 'outline-color', 'outline-offset'].map(property => getComputedStyle(button).getPropertyValue(property))).toEqual(ring)
          await userEvent.unhover(button)
          expect(button.matches(':active')).toBe(true)
          expect(appearance(button)).toEqual(active)
        } finally { await userEvent.keyboard('[/Space]') }
        button.blur()
        baseline.disabled = true
        const disabledAppearance = appearance(baseline)
        for (const mode of ['native', 'status', 'both']) {
          button.disabled = mode !== 'status'
          button.dataset.status = mode === 'native' ? 'loading' : 'loading disabled'
          expect(appearance(button)).toEqual(disabledAppearance)
          await userEvent.hover(button)
          expect(appearance(button)).toEqual(disabledAppearance)
          button.focus()
          await userEvent.keyboard('[Space>]')
          try {
            if (mode === 'status') expect(button.matches(':active')).toBe(true)
            expect(appearance(button)).toEqual(disabledAppearance)
            expect(getComputedStyle(button).cursor).toBe('not-allowed')
          } finally { await userEvent.keyboard('[/Space]') }
          await userEvent.unhover(button)
          button.blur()
        }
        baseline.remove()
      }
    })
  }

  test('隔离来源：停用 TS 后对照必须失败，旧 CSS 不替 Button 通过', () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button solid accent>隔离</Button>, host)
    const button = host.querySelector<HTMLButtonElement>('button')!
    button.style.transition = 'none'
    const baseline = baselineButton(button)
    expect(appearance(button)).toEqual(appearance(baseline))
    const style = document.head.querySelector<HTMLStyleElement>(buttonStyleSelector)!
    style.sheet!.disabled = true
    expect(appearance(button)).not.toEqual(appearance(baseline))
    style.sheet!.disabled = false
    expect(appearance(button)).toEqual(appearance(baseline))
  })

  test.each(['light', 'dark'])('%s：所有 variant、tone、size 与 loading 的禁用组合保持各 feature 的覆盖', (theme) => {
    document.documentElement.dataset.theme = theme
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

    for (const [index, entry] of cases.entries()) {
      const button = host.querySelector<HTMLButtonElement>(`[data-testid="disabled-${index}"]`)!
      const baseline = baselineButton(button)
      const expected = getComputedStyle(baseline)
      if (entry.mode === 'native') button.dataset.status = entry.loading ? 'loading' : ''
      if (entry.mode === 'status') button.disabled = false
      button.style.transition = 'none'
      expect(button.matches(whenDisabled.header.replace('&', ''))).toBe(true)
      const computed = getComputedStyle(button)
      expect(computed.backgroundColor).toBe(expected.backgroundColor)
      expect(computed.color).toBe(expected.color)
      expect(computed.boxShadow).toBe('none')
      expect(computed.cursor).toBe('not-allowed')
      expect(computed.opacity).toBe('0.56')
      expect(computed.transform).toBe('none')
      expect(computed.minHeight).toBe(entry.size === 'small' ? '32px' : entry.size === 'large' ? '64px' : entry.size === 'xlarge' ? '80px' : '48px')
      baseline.remove()
    }
  })

  test('材料与基础 token 等价，挂载前后非 Button 消费者及品牌覆盖不变', () => {
    const materials = [
      [action, '--color-action'], [actionHover, '--color-action-hover'], [actionActive, '--color-action-active'],
      [actionForeground, '--color-action-fg'], [actionLine, '--color-action-line'],
      [foreground, '--color-fg'], [strongForeground, '--color-fg-strong'],
      [accent, '--color-accent'], [softAccent, '--color-accent-soft'], [strongAccent, '--color-accent-strong'],
      [accentForeground, '--color-accent-fg'], [accentFocus, '--color-accent-focus'],
      [danger, '--color-bad'], [softDanger, '--color-bad-soft'], [dangerForeground, '--color-bad-fg'], [dangerLine, '--color-bad-line'],
    ] as [typeof action, string][]
    const shadows = [[flat, '--shadow-0'], [low, '--shadow-1'], [raised, '--shadow-2'], [elevated, '--shadow-3']] as [typeof flat, string][]
    const probes = [...materials.map(([material, token]) => ({ material, token, property: 'color' })),
      ...shadows.map(([material, token]) => ({ material, token, property: 'box-shadow' }))]
    const elements = probes.map((probe, index) => {
      const reference = document.body.appendChild(document.createElement('div'))
      reference.style.setProperty(probe.property, `var(${probe.token})`)
      const actual = document.body.appendChild(document.createElement('div'))
      actual.className = `material-${index}`
      handles.push(rule(`.material-${index}`, probe.property, probe.material))
      return { ...probe, reference, actual }
    })
    const input = document.body.appendChild(document.createElement('input'))
    input.className = 'Input'
    const popover = document.body.appendChild(document.createElement('div'))
    popover.className = 'Popover'
    const nonButton = [...elements.map(entry => entry.reference), input, popover]
    // 根变量、Input/Popover 边框和 Dashboard 所用品牌材料都不得被 Button 登记覆盖。
    for (const theme of ['light', 'dark']) {
      document.documentElement.dataset.theme = theme
      for (const brand of ['', 'oklch(60% 0.15 140)']) {
        document.documentElement.style.setProperty('--base-brand', brand)
        const existing = document.head.querySelector<HTMLStyleElement>(buttonStyleSelector)
        if (existing) existing.sheet!.disabled = true
        const before = nonButton.map(element => ({ ...appearance(element), outline: getComputedStyle(element).outlineColor }))
        const style = existing ?? mountButtonStyles()
        style.sheet!.disabled = false
        expect(nonButton.map(element => ({ ...appearance(element), outline: getComputedStyle(element).outlineColor }))).toEqual(before)
        for (const entry of elements) {
          expect(getComputedStyle(entry.actual).getPropertyValue(entry.property)).toBe(getComputedStyle(entry.reference).getPropertyValue(entry.property))
        }
        const host = document.body.appendChild(document.createElement('div'))
        const unmount = render(() => <Button solid>品牌</Button>, host)
        const button = host.querySelector<HTMLButtonElement>('button')!
        button.style.transition = 'none'
        const baseline = baselineButton(button)
        expect(appearance(button)).toEqual(appearance(baseline))
        const color = getComputedStyle(button).backgroundColor
        if (theme === 'light' && brand) expect(color).toBe('oklch(0.6 0.15 140)')
        if (theme === 'dark') expect(color).toBe('oklch(0.7 0.18 260)')
        unmount()
        host.remove()
      }
    }
    const css = Array.from(document.head.querySelector<HTMLStyleElement>(buttonStyleSelector)!.sheet!.cssRules).map(rule => rule.cssText).join('\n')
    expect(css).not.toMatch(/--(?:color-(?:brand|accent|action|bad|foreground)|dye-neutral-\d|shadow-[0-3])\s*:/)
  })

  test('四尺寸、方圆角、内容与拉伸容器保持旧布局，后置 layer 可覆盖', () => {
    const style = mountButtonStyles()
    const sizes: ButtonProps['size'][] = ['small', undefined, 'large', 'xlarge']
    const host = document.body.appendChild(document.createElement('div'))
    host.style.cssText = 'display:flex; flex-direction:column; gap:16px'
    dispose = render(() => sizes.flatMap(size => [
      <Button size={size}>普通文字</Button>,
      <Button size={size}><span aria-hidden="true">＋</span><span>图标文字</span></Button>,
      <Button size={size} htmlProps={{ style: 'max-width:160px' }}>窄容器中较长的按钮内容换行</Button>,
    ]), host)
    for (const button of Array.from(host.querySelectorAll<HTMLButtonElement>('button'))) {
      const baseline = baselineButton(button)
      const actual = getComputedStyle(button)
      const expected = getComputedStyle(baseline)
      for (const property of ['display', 'align-self', 'align-items', 'justify-content', 'min-height', 'padding', 'gap', 'font-size', 'font-weight', 'line-height', 'border-radius', 'corner-shape', 'width', 'height']) {
        expect(actual.getPropertyValue(property), property).toBe(expected.getPropertyValue(property))
      }
      expect(actual.getPropertyValue('corner-shape')).toBe('superellipse(2)')
      const children = button.querySelectorAll('span')
      if (children.length === 2) expect(children[1].getBoundingClientRect().left - children[0].getBoundingClientRect().right).toBeCloseTo(parseFloat(actual.columnGap), 5)
      baseline.remove()
    }
    const stretch = document.body.appendChild(document.createElement('div'))
    stretch.style.cssText = 'display:flex;height:120px'
    const button = host.querySelectorAll<HTMLButtonElement>('button')[3]
    stretch.append(button)
    expect(button.getBoundingClientRect().height).toBe(48)
    expect(button.getBoundingClientRect().top - stretch.getBoundingClientRect().top).toBe(36)
    expect(getComputedStyle(button).transitionDuration.split(',').every(duration => duration.trim() === '0.12s')).toBe(true)
    const override = document.body.appendChild(document.createElement('style'))
    override.textContent = '@layer button-test-override { .Button { background-color: rgb(1, 2, 3); } }'
    button.style.transition = 'none'
    expect(getComputedStyle(button).backgroundColor).toBe('rgb(1, 2, 3)')
    for (const rule of Array.from(style.sheet!.cssRules)) {
      if (rule.cssText.includes('.Button')) expect(rule).toBeInstanceOf(CSSLayerBlockRule)
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
    reference.style.color = 'var(--color-bad-line)'
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
    const layer = cssRules.find(rule => rule instanceof CSSLayerBlockRule && rule.name === 'uikit') as CSSLayerBlockRule
    expect(Array.from(layer.cssRules).filter(rule => rule instanceof CSSStyleRule && rule.selectorText === '.Button')).toHaveLength(1)
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
    expect(disabledStyle.opacity).toBe('0.56')

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
