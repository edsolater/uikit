/** 保留旧样式 DOM 协议的视觉反例；新 Button API 的 DOM 描述单独验证，样式尚未迁移。 */
import { declare, modify, variable, disabledFade, add, cssRoot, rule, rules, type RulesHandle, whenHover, whenActive, whenDisabled, $borderRadius, $backgroundColor, contentLayout, subtle, spaceSmall, surfaceColor, foregroundColor, interactiveColors, badColors, toneColor, toneColors, shadowFlat, shadowLow, shadowRaised, shadowElevated } from '@/style-system'
import '../../../css/all-base.css'
import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createState } from '@/foundation'
import { Button, type ButtonProps, type ButtonAppearance } from './Button'
import { buttonMapping } from './Button.mapping'
import { buttonSurfaceSource, buttonSurfaceCanvas, buttonSurfaceStrength } from './Button.style'
import './Button.style'
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

/** 读取主体外观；焦点轮廓在用例中单独比较。 */
function appearance(button: HTMLElement) {
  const style = getComputedStyle(button)
  return Object.fromEntries(['background-color', 'color', 'border-top-color', 'box-shadow', 'opacity', 'transform'].map(key => [key, style.getPropertyValue(key)]))
}

/** 用浏览器转换到同一色空间再比较数值，容许 CSS 序列化的末位舍入。 */
function expectSameColor(actual: string, expected: string) {
  const numbers = (content: string) => {
    const probe = document.body.appendChild(document.createElement('div'))
    probe.style.color = `color(from ${content} srgb r g b / alpha)`
    const result = getComputedStyle(probe).color.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)!.map(Number)
    probe.remove()
    if (result.length === 3) result.push(1)
    return result
  }
  const actualNumbers = numbers(actual)
  const expectedNumbers = numbers(expected)
  expect(actualNumbers).toHaveLength(expectedNumbers.length)
  actualNumbers.forEach((amount, index) => expect(amount).toBeCloseTo(expectedNumbers[index], 4))
}

/** 读取感知色空间的色度，比较声量而不冻结旧混色数值。 */
function chroma(content: string): number {
  const probe = document.body.appendChild(document.createElement('div'))
  probe.style.color = `oklch(from ${content} l c h / alpha)`
  const color = getComputedStyle(probe).color
  probe.remove()
  return Number(color.match(/oklch\(\S+\s+(\S+)/)![1])
}

/** 颜色比较保留视觉等价断言，其他外观仍严格逐项一致。 */
function expectSameAppearance(actual: Record<string, string>, expected: Record<string, string>) {
  for (const name of Object.keys(actual)) {
    if (name.endsWith('color')) expectSameColor(actual[name], expected[name])
    else expect(actual[name], name).toBe(expected[name])
  }
}

/** 背景与前景分别比较，避免混色空间标签导致同色误判。 */
function expectSameColors(actual: string[], expected: string[]) {
  actual.forEach((content, index) => expectSameColor(content, expected[index]))
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
  test('新组件描述外观、强调与语气，动态强调退出后不输出旧 variant', () => {
    const emphasis = createState<'soft' | 'strong' | undefined>('soft')
    const selectedAppearance = createState<ButtonAppearance | undefined>('filled')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button appearance={selectedAppearance} emphasis={emphasis} danger small loading>确认</Button>, host)
    const button = host.querySelector('button')!
    expect(button.dataset.appearance).toBe('filled')
    expect(button.dataset.emphasis).toBe('soft')
    expect(button.dataset.tone).toBe('danger')
    expect(button.dataset.size).toBe('small')
    expect(button.dataset.status).toBe('loading')
    expect(button.hasAttribute('data-variant')).toBe(false)
    for (const name of ['appearance', 'emphasis', 'tone', 'strong', 'danger', 'small']) expect(button.hasAttribute(name)).toBe(false)
    emphasis.set('strong')
    expect(button.dataset.emphasis).toBe('strong')
    emphasis.set(undefined)
    expect(button.hasAttribute('data-emphasis')).toBe(false)
    selectedAppearance.set('plain')
    expect(button.dataset.appearance).toBe('plain')
    selectedAppearance.set(undefined)
    expect(button.dataset.appearance).toBe('outlined')
  })

  test('外界生成前配置公开外观转换表，不引入旧样式属性', () => {
    const host = document.body.appendChild(document.createElement('div'))
    Object.assign(buttonMapping.appearance, { undefined: 'filled' })
    try {
      dispose = render(() => <Button>配置外观</Button>, host)
      const button = host.querySelector('button')!
      expect(button.dataset.appearance).toBe('filled')
      expect(button.hasAttribute('data-variant')).toBe(false)
    } finally {
      Object.assign(buttonMapping.appearance, { undefined: 'outlined' })
    }
  })

  test('公开表面控制点使用同一对象，局部声明与修改可组合且移除后恢复', async () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <>
      <button class="Button" data-tone="accent" data-control="first">第一作用域</button>
      <button class="Button" data-tone="accent" data-control="second">第二作用域</button>
      <button class="Button" data-tone="accent">未控制</button>
    </>, host)
    const [first, second, untouched] = host.querySelectorAll<HTMLButtonElement>('button')
    for (const button of [first, second, untouched]) button.style.transition = 'none'
    await userEvent.unhover(first)
    const initial = appearance(first)
    expectSameAppearance(appearance(second), initial)
    expectSameAppearance(appearance(untouched), initial)
    const path = ['@layer uikit', '.Button', '&[data-control="first"]']
    const source = rules(path, declare(buttonSurfaceSource, 'oklch(0.6 0.2 30)'))
    handles.push(source)
    cssRoot.mount()
    const sourceOnly = appearance(first)
    expect(sourceOnly['background-color']).not.toBe(initial['background-color'])
    const canvas = rules(path, declare(buttonSurfaceCanvas, 'oklch(0.9 0.02 120)'))
    handles.push(canvas)
    cssRoot.mount()
    const selected = appearance(first)
    expect(selected['background-color']).not.toBe(sourceOnly['background-color'])
    expect(selected['background-color']).not.toBe(initial['background-color'])
    expectSameAppearance(appearance(second), initial)
    const adjustment = rules(path, modify(buttonSurfaceStrength, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 0.2) })))
    handles.push(adjustment)
    cssRoot.mount()
    const adjusted = appearance(first)
    expect(chroma(adjusted['background-color'])).toBeGreaterThan(chroma(selected['background-color']))
    expectSameAppearance(appearance(second), initial)
    expectSameAppearance(appearance(untouched), initial)
    await userEvent.hover(first)
    const hovered = appearance(first)
    expect(chroma(hovered['background-color'])).toBeGreaterThan(chroma(adjusted['background-color']))
    await userEvent.unhover(first)
    expectSameAppearance(appearance(first), adjusted)
    const otherPath = ['@layer uikit', '.Button', '&[data-control="second"]']
    const other = rules(otherPath, [declare(buttonSurfaceSource, 'oklch(0.6 0.2 260)'), declare(buttonSurfaceCanvas, 'white')])
    handles.push(other)
    cssRoot.mount()
    const otherMaterials = appearance(second)
    const otherStrength = rules(otherPath, declare(buttonSurfaceStrength, 0.6))
    handles.push(otherStrength)
    cssRoot.mount()
    expect(chroma(appearance(second)['background-color'])).toBeGreaterThan(chroma(otherMaterials['background-color']))
    expect(appearance(second)['background-color']).not.toBe(initial['background-color'])
    expect(appearance(second)['background-color']).not.toBe(appearance(first)['background-color'])
    expectSameAppearance(appearance(first), adjusted)
    expectSameAppearance(appearance(untouched), initial)
    adjustment.remove()
    cssRoot.mount()
    expectSameAppearance(appearance(first), selected)
    source.remove()
    cssRoot.mount()
    expect(appearance(first)['background-color']).not.toBe(selected['background-color'])
    canvas.remove()
    otherStrength.remove()
    other.remove()
    cssRoot.mount()
    for (const button of [first, second, untouched]) expectSameAppearance(appearance(button), initial)
  })

  test.each([undefined, 'bare', 'solid'] as const)('局部语气成员在状态参数消费中保持隔离并退出恢复：%s', async (variant) => {
    const palettes = [
      { tone: 'rgb(56, 120, 180)', soft: 'rgb(12, 80, 140)', strong: 'rgb(34, 100, 160)', foreground: 'rgb(78, 140, 200)', line: 'rgb(90, 20, 160)' },
      { tone: 'rgb(180, 56, 120)', soft: 'rgb(140, 12, 80)', strong: 'rgb(160, 34, 100)', foreground: 'rgb(200, 78, 140)', line: 'rgb(160, 90, 20)' },
    ]
    for (const [index, palette] of palettes.entries()) handles.push(rules(`.Button[data-local-tone="${index}"]`, [
      [toneColor, palette.tone], [toneColors('soft'), palette.soft],
      [toneColors('strong'), palette.strong], [toneColors('foreground'), palette.foreground], [toneColors('line'), palette.line],
    ]))
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => palettes.map((_, index) => <button class="Button" data-variant={variant} data-tone="danger" data-local-tone={index}>局部语气</button>), host)
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('button'))
    const samples: { normal: Record<string, string>; hover: Record<string, string>; active: Record<string, string> }[] = []
    for (const [index, button] of buttons.entries()) {
      button.style.transition = 'none'
      const normal = appearance(button)
      expectSameColor(normal.color, variant === 'solid' ? palettes[index].foreground : palettes[index].strong)
      if (variant === 'solid') expectSameColor(normal['background-color'], palettes[index].tone)
      if (variant === 'bare') expectSameColor(normal['background-color'], 'transparent')
      button.focus()
      await userEvent.keyboard('[ArrowRight]')
      expect(button.matches(':focus-visible')).toBe(true)
      expectSameColor(getComputedStyle(button).outlineColor, palettes[index].line)
      await userEvent.hover(button)
      const hover = appearance(button)
      expect(hover['background-color']).not.toBe(normal['background-color'])
      await userEvent.keyboard('[Space>]')
      let active: Record<string, string>
      try {
        expect(button.matches(':hover:active')).toBe(true)
        active = appearance(button)
        expect(active['background-color']).not.toBe(hover['background-color'])
        expectSameColor(active.color, normal.color)
      } finally { await userEvent.keyboard('[/Space]') }
      expectSameAppearance(appearance(button), hover)
      await userEvent.unhover(button)
      button.blur()
      expectSameAppearance(appearance(button), normal)
      samples.push({ normal, hover, active: active! })
    }
    for (const state of ['normal', 'hover', 'active'] as const) {
      expect(samples[0][state].color).not.toBe(samples[1][state].color)
      if (variant !== 'bare' || state !== 'normal') expect(samples[0][state]['background-color']).not.toBe(samples[1][state]['background-color'])
    }
    if (variant === 'bare') {
      const alpha = (color: string) => Number(color.match(/\/\s*([\d.]+)/)?.[1] ?? 1)
      for (const sample of samples) {
        expect(alpha(sample.hover['background-color'])).toBeGreaterThan(0)
        expect(alpha(sample.active['background-color'])).toBeGreaterThan(alpha(sample.hover['background-color']))
      }
    }
  })

  test.each([undefined, 'bare', 'solid'] as const)('统一禁用降低整体声量并保留局部角色和恢复：%s', async (variant) => {
    const surface = 'rgb(12, 34, 56)'
    const foreground = 'rgb(78, 90, 123)'
    handles.push(rules('.Button[data-local-role]', [declare(surfaceColor, surface), declare(foregroundColor, foreground)]))
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <button class="Button" data-variant={variant} data-tone="danger" data-local-role>局部禁用</button>, host)
    const button = host.querySelector('button')!
    button.style.transition = 'none'
    const read = () => [getComputedStyle(button).backgroundColor, getComputedStyle(button).color]
    const normal = read()
    expectSameColors(normal, [surface, foreground])
    button.disabled = true
    await userEvent.hover(button)
    expectSameColors(read(), normal)
    expect(Number(getComputedStyle(button).opacity)).toBe(disabledFade.content)
    button.disabled = false
    button.dataset.status = 'disabled'
    button.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(button.matches(':hover:active')).toBe(true)
      expectSameColors(read(), normal)
      expect(getComputedStyle(button).transform).toBe('none')
    } finally { await userEvent.keyboard('[/Space]') }
    await userEvent.unhover(button)
    delete button.dataset.status
    expectSameColors(read(), normal)
    expect(getComputedStyle(button).opacity).toBe('1')
  })

  test('solid 常态背景保留组件 surfaceColor 的局部覆盖', () => {
    handles.push(rules('.Button[data-variant="solid"][data-surface-probe]', [
      declare(surfaceColor, 'rgb(12, 34, 56)'),
    ]))
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <button class="Button" data-variant="solid" data-surface-probe>局部表面</button>, host)
    const button = host.querySelector('button')!
    button.style.transition = 'none'
    expectSameColor(getComputedStyle(button).backgroundColor, 'rgb(12, 34, 56)')
  })

  test.each(['light', 'dark'])('%s：声量、语气与状态独立组合，反馈与退出保持层次', async (theme) => {
    document.documentElement.dataset.theme = theme
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    const variants: ('bare' | 'solid' | undefined)[] = [undefined, 'bare', 'solid']
    const tones: ('accent' | 'danger' | undefined)[] = [undefined, 'accent', 'danger']
    dispose = render(() => variants.flatMap(variant => tones.map(tone => <button class="Button" data-variant={variant} data-tone={tone}>组合</button>)), host)
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('button'))
    for (const [index, button] of buttons.entries()) {
      button.style.transition = 'none'
      await userEvent.unhover(button)
      const normal = appearance(button)
      const variant = variants[Math.floor(index / 3)]
      if (variant === 'bare') expectSameColor(normal['background-color'], 'transparent')
      expect(normal.opacity).toBe('1')
      await userEvent.hover(button)
      const hover = appearance(button)
      expect(hover['background-color']).not.toBe(normal['background-color'])
      button.focus()
      await userEvent.keyboard('[Space>]')
      try {
        expect(button.matches(':hover:active')).toBe(true)
        expect(appearance(button)['background-color']).not.toBe(hover['background-color'])
        expect(appearance(button).transform).not.toBe('none')
      } finally { await userEvent.keyboard('[/Space]') }
      expectSameAppearance(appearance(button), hover)
      await userEvent.unhover(button)
      button.blur()
      expectSameAppearance(appearance(button), normal)
    }
    for (const toneIndex of [1, 2]) {
      const normal = appearance(buttons[toneIndex])
      const solid = appearance(buttons[6 + toneIndex])
      expect(chroma(solid['background-color'])).toBeGreaterThan(chroma(normal['background-color']))
      expect(solid['color']).not.toBe(normal['color'])
    }
    for (const variantIndex of [0, 1, 2]) {
      const accent = buttons[variantIndex * 3 + 1]
      const danger = buttons[variantIndex * 3 + 2]
      // bare 的透明背景以文字承担语气，其余声量同时以表面承担。
      if (variantIndex !== 2) expect(appearance(accent).color).not.toBe(appearance(danger).color)
      if (variantIndex !== 1) expect(appearance(accent)['background-color']).not.toBe(appearance(danger)['background-color'])
    }
  })

  test('隔离来源：停用 TS 样式会失去实心背景，恢复挂载后恢复', () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <button class="Button" data-variant="solid" data-tone="accent">隔离</button>, host)
    const button = host.querySelector<HTMLButtonElement>('button')!
    button.style.transition = 'none'
    const before = appearance(button)
    const style = document.head.querySelector<HTMLStyleElement>(buttonStyleSelector)!
    style.sheet!.disabled = true
    expect(appearance(button)['background-color']).not.toBe(before['background-color'])
    style.sheet!.disabled = false
    expectSameAppearance(appearance(button), before)
  })

  test.each(['light', 'dark'])('%s：所有 variant、tone、size 与 loading 的禁用组合保持各 feature 的覆盖', (theme) => {
    document.documentElement.dataset.theme = theme
    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    cssRoot.mount()

    const variants: ('bare' | 'solid' | undefined)[] = [undefined, 'bare', 'solid']
    const tones: ('accent' | 'danger' | undefined)[] = [undefined, 'accent', 'danger']
    const sizes: ButtonProps['size'][] = [undefined, 'small', 'large', 'xlarge']
    const cases = variants.flatMap(variant => tones.flatMap(tone => sizes.flatMap(size =>
      [false, true].flatMap(loading => ['native', 'status', 'both'].map(mode => ({ variant, tone, size, loading, mode }))))))
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => cases.map((entry, index) => (
      <button class="Button" data-variant={entry.variant} data-tone={entry.tone} data-size={entry.size}
        data-status={entry.loading ? 'loading disabled' : 'disabled'} disabled data-testid={`disabled-${index}`}>禁用</button>
    )), host)

    for (const [index, entry] of cases.entries()) {
      const button = host.querySelector<HTMLButtonElement>(`[data-testid="disabled-${index}"]`)!
      if (entry.mode === 'native') button.dataset.status = entry.loading ? 'loading' : ''
      if (entry.mode === 'status') button.disabled = false
      button.style.transition = 'none'
      expect(button.matches(whenDisabled.header.replace('&', ''))).toBe(true)
      const computed = getComputedStyle(button)
      expect(computed.boxShadow).toBe('none')
      expect(computed.cursor).toBe('not-allowed')
      expect(Number(computed.opacity)).toBe(disabledFade.content)
      expect(computed.transform).toBe('none')
      expect(computed.minHeight).toBe(entry.size === 'small' ? '32px' : entry.size === 'large' ? '64px' : entry.size === 'xlarge' ? '80px' : '48px')
    }
  })

  test('挂载 Button 样式保留其他组件的静态样式和阴影契约', () => {
    const shadows: [typeof shadowFlat, string][] = [[shadowFlat, '--shadow-0'], [shadowLow, '--shadow-1'], [shadowRaised, '--shadow-2'], [shadowElevated, '--shadow-3']]
    const probes = shadows.map(([material, token], index) => {
      const reference = document.body.appendChild(document.createElement('div'))
      reference.style.boxShadow = `var(${token})`
      const actual = document.body.appendChild(document.createElement('div'))
      actual.className = `shadow-probe-${index}`
      handles.push(rule(`.shadow-probe-${index}`, 'box-shadow', material))
      return { reference, actual }
    })
    const input = document.body.appendChild(document.createElement('input'))
    input.className = 'Input'
    const popover = document.body.appendChild(document.createElement('div'))
    popover.className = 'Popover'
    const nonButton = [...probes.map(probe => probe.reference), input, popover]
    const style = mountButtonStyles()
    for (const theme of ['light', 'dark']) {
      document.documentElement.dataset.theme = theme
      style.sheet!.disabled = true
      const before = nonButton.map(element => ({ ...appearance(element), outline: getComputedStyle(element).outlineColor }))
      style.sheet!.disabled = false
      expect(nonButton.map(element => ({ ...appearance(element), outline: getComputedStyle(element).outlineColor }))).toEqual(before)
      for (const { actual, reference } of probes) expect(getComputedStyle(actual).boxShadow).toBe(getComputedStyle(reference).boxShadow)
    }
  })

  test('Button 消费 JS 品牌材料，局部品牌覆盖改变主体并保留相邻组件', () => {
    const style = mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <>
      <button class="Button" data-variant="solid" data-testid="local-brand">品牌</button>
      <button class="Button" data-variant="solid" data-testid="neighbor-brand">邻居</button>
    </>, host)
    const button = host.querySelector<HTMLButtonElement>('[data-testid="local-brand"]')!
    const neighbor = host.querySelector<HTMLButtonElement>('[data-testid="neighbor-brand"]')!
    button.style.transition = 'none'
    neighbor.style.transition = 'none'
    const before = getComputedStyle(neighbor).backgroundColor
    const originalCSS = style.textContent
    button.style.setProperty('--brand-color', 'oklch(60% 0.15 140)')
    expect(getComputedStyle(button).backgroundColor).not.toBe(before)
    expect(getComputedStyle(neighbor).backgroundColor).toBe(before)
    expect(style.textContent).toBe(originalCSS)
    expect(style.textContent).not.toMatch(/var\(--(?:color-|dye-|base-)/)
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
      const actual = getComputedStyle(button)
      expect(actual.display).toBe('flex')
      expect(actual.alignSelf).toBe('center')
      expect(actual.alignItems).toBe('center')
      expect(actual.justifyContent).toBe('center')
      expect(actual.borderRadius).toBe('999px')
      expect(actual.getPropertyValue('corner-shape')).toBe('superellipse(2)')
      const children = button.querySelectorAll('span')
      if (children.length === 2) expect(children[1].getBoundingClientRect().left - children[0].getBoundingClientRect().right).toBeCloseTo(parseFloat(actual.columnGap), 5)
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
      <Button filled danger loading disabled>禁用</Button>
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
    handles.push(rule('.focus-reference-interactive', 'color', interactiveColors('line')))
    handles.push(rule('.focus-reference-bad', 'color', badColors('line')))
    cssRoot.mount()
    reference.className = 'focus-reference-interactive'
    const interactiveLine = getComputedStyle(reference).color
    reference.className = 'focus-reference-bad'
    const badLine = getComputedStyle(reference).color

    await userEvent.tab()
    expect(document.activeElement).toBe(defaultButton)
    expect(defaultButton.matches(':focus-visible')).toBe(true)
    const defaultStyle = getComputedStyle(defaultButton)
    expect(defaultStyle.outlineWidth).toBe('2px')
    expect(defaultStyle.outlineStyle).toBe('solid')
    expect(defaultStyle.outlineOffset).toBe('2px')
    expect(defaultStyle.outlineColor).toBe(interactiveLine)

    await userEvent.tab()
    expect(document.activeElement).toBe(dangerButton)
    expect(dangerButton.matches(':focus-visible')).toBe(true)
    const dangerStyle = getComputedStyle(dangerButton)
    expect(dangerStyle.outlineWidth).toBe('2px')
    expect(dangerStyle.outlineStyle).toBe('solid')
    expect(dangerStyle.outlineOffset).toBe('2px')
    expect(dangerStyle.outlineColor).toBe(badLine)
  })

  test('模块导入只登记，应用在首次渲染前统一挂载全部样式', async () => {
    expect(document.head.querySelector(buttonStyleSelector)).toBeNull()

    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    expect(style.sheet!.cssRules).toHaveLength(0)

    handles.push(rules('.shared-input', [[$borderRadius, subtle], contentLayout({ padding: ['8px', spaceSmall] })]))
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
          <button class="Button" data-variant="solid" data-testid="solid">
            Solid
          </button>
          <button class="Button" data-variant="bare" data-testid="bare">
            Bare
          </button>
          <button class="Button" data-variant="solid" data-tone="accent" data-testid="accent">
            Accent
          </button>
          <button class="Button" data-variant="solid" data-tone="danger" data-testid="danger">
            Danger
          </button>
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
    expect(cssText).toContain('&:where(:where(:hover):where(:not(:disabled, [data-status~="disabled"])))')
    expect(cssText).toContain('&:where(:where(:active):where(:not(:disabled, [data-status~="disabled"])))')
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
    expect(Number(disabledStyle.opacity)).toBe(disabledFade.content)

    const defaultBackground = defaultStyle.backgroundColor
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).not.toBe(defaultBackground)
    await userEvent.unhover(getButton('default'))

    handles.push(rule('.Button[data-testid="default"]', $backgroundColor, variable('rgb(1, 2, 3)', { name: "browser-button-color", states: Object.fromEntries([['hover', 'rgb(4, 5, 6)']]) })))
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

    const originalBackground = getComputedStyle(getButton('default')).backgroundColor
    getButton('default').style.setProperty('--paper-color', 'oklch(0.2 0.003 260)')
    expect(getComputedStyle(getButton('default')).backgroundColor).not.toBe(originalBackground)
    const beforeMount = Array.from(style.sheet!.cssRules)
    cssRoot.mount()
    const afterMount = Array.from(style.sheet!.cssRules)
    expect(afterMount).toHaveLength(beforeMount.length)
    for (let index = 0; index < beforeMount.length; index++) expect(afterMount[index]).toBe(beforeMount[index])
  })
})
