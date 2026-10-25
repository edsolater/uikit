import { expect, test } from 'vitest'
import { cdp, userEvent } from 'vitest/browser'
import type { CDPSession } from '@vitest/browser-playwright'
import { compileRules } from '../css-root'
import { variable, variableFrom } from '../variable'
import { themeBrand } from '../pieces/contents/atoms/color/seeds'
import { colorCanvas, colorContent, colorBad, colorAction, colorSurface, colorBoundary } from '../pieces/contents/atoms/color/roles'
import { shadow, shadowDistance, shadowColor } from '../pieces/contents/atoms/shadow'
import { motionDuration } from '../pieces/contents/atoms/motion'

test('自足材料在同一份 CSS 中响应亮暗主题和减少动效，应用可显式替换时长基准', async () => {
  const session = await cdp() as CDPSession
  const style = document.createElement('style')
  const element = document.createElement('div')
  element.className = 'StandaloneMaterials'
  element.style.transitionProperty = 'opacity'
  style.textContent = compileRules([
    [['.StandaloneMaterials'], 'background-color', colorCanvas],
    [['.StandaloneMaterials'], 'color', colorContent],
    [['.StandaloneMaterials'], 'border-color', colorBad],
    [['.StandaloneMaterials'], 'box-shadow', shadow.variant('popover')],
    [['.StandaloneMaterials'], 'transition-duration', motionDuration],
  ])
  document.head.append(style)
  document.body.append(element)
  try {
    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
    const light = getComputedStyle(element).backgroundColor
    const shadow = getComputedStyle(element).boxShadow
    expect(light).not.toBe('rgba(0, 0, 0, 0)')
    expect(shadow).not.toBe('none')
    expect(getComputedStyle(element).transitionDuration).toBe('0.18s')
    document.documentElement.dataset.theme = 'dark'
    expect(getComputedStyle(element).backgroundColor).not.toBe(light)
    expect(getComputedStyle(element).boxShadow).not.toBe(shadow)
    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    expect(getComputedStyle(element).transitionDuration).toBe('0s')
    document.documentElement.style.setProperty(motionDuration.toCSSString(), '90ms')
    expect(getComputedStyle(element).transitionDuration).toBe('0.09s')
  } finally {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty(motionDuration.toCSSString())
    await session.send('Emulation.setEmulatedMedia', { features: [] })
    element.remove()
    style.remove()
  }
})

test('用途阴影可独立覆盖，其他场景和来源保持原值', () => {
  const cardShadow = shadow.variant('card')
  const style = document.createElement('style')
  const host = document.createElement('div')
  host.innerHTML = '<div class="CardMaterial"></div><div class="LevelMaterial"></div><div class="RaisedMaterial"></div>'
  style.textContent = compileRules([
    [['.CardMaterial'], 'box-shadow', cardShadow],
    [['.LevelMaterial'], 'box-shadow', shadow],
    [['.RaisedMaterial'], 'box-shadow', shadow.variant('popover')],
  ])
  document.head.append(style)
  document.body.append(host)
  try {
    const [card, level, raised] = [...host.children] as HTMLElement[]
    const originalLevel = getComputedStyle(level).boxShadow
    const originalRaised = getComputedStyle(raised).boxShadow
    expect(getComputedStyle(card).boxShadow).toBe(originalLevel)
    card.style.setProperty(cardShadow.toCSSString(), 'none')
    expect(getComputedStyle(card).boxShadow).toBe('none')
    expect(getComputedStyle(level).boxShadow).toBe(originalLevel)
    expect(getComputedStyle(raised).boxShadow).toBe(originalRaised)
    document.documentElement.style.setProperty(shadowDistance.toCSSString(), '2px')
    expect(getComputedStyle(level).boxShadow).toContain('0px 2px 4px 0px')
    expect(getComputedStyle(raised).boxShadow).toContain('0px 36px 80px 0px')
    document.documentElement.style.setProperty(shadowColor.toCSSString(), 'oklch(0.5 0.1 30 / 0.08)')
    expect(getComputedStyle(level).boxShadow).toContain('oklch(0.5 0.1 30 / 0.06)')
    expect(getComputedStyle(level).boxShadow).toContain('oklch(0.5 0.1 30 / 0.08)')
  } finally {
    document.documentElement.style.removeProperty(shadowDistance.toCSSString())
    document.documentElement.style.removeProperty(shadowColor.toCSSString())
    host.remove(); style.remove()
  }
})

test('局部用途在暗色、柔和及悬停同时成立时保留部分差异和来源覆盖', async () => {
  const source = variable(themeBrand, { name: 'local-material-source', address: '.MaterialParts' })
  const local = variableFrom(colorAction, source, { name: 'local-action', address: '.MaterialParts' })
  const content = local.variant('content')
  const boundary = local.variant('boundary')
  const surface = local.variant('surface')
  const style = document.createElement('style')
  style.textContent = compileRules([
    [['.MaterialParts'], 'background-color', surface],
    [['.MaterialParts'], 'color', content],
    [['.MaterialParts'], 'border-color', boundary],
  ])
  const button = document.createElement('button')
  button.className = 'MaterialParts'
  button.dataset.emphasis = 'soft'
  button.textContent = '部分状态'
  document.head.append(style)
  document.body.append(button)
  const colors = () => {
    const computed = getComputedStyle(button)
    return [computed.backgroundColor, computed.color, computed.borderTopColor]
  }
  try {
    const light = colors()
    document.documentElement.dataset.theme = 'dark'
    const dark = colors()
    expect(dark).not.toEqual(light)
    expect(dark[0]).toContain('/ 0.14)')
    expect(dark[1]).toContain('/ 0.82)')
    expect(dark[2]).toContain('/ 0.22)')
    await userEvent.hover(button)
    const hovered = colors()
    expect(hovered[0]).toContain('/ 0.2)')
    expect(hovered[1]).toContain('/ 0.9)')
    expect(hovered[2]).toContain('/ 0.32)')
    expect(new Set(hovered).size).toBe(3)
    const session = await cdp() as CDPSession
    await session.send('DOM.enable')
    const { nodes } = await session.send('DOM.getFlattenedDocument', { depth: -1, pierce: true })
    const { nodeId } = nodes.find(node => node.attributes?.includes('MaterialParts'))!
    await session.send('CSS.enable')
    await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover', 'active'] })
    expect(colors()[0]).toContain('/ 0.26)')
    expect(colors()[2]).toContain('/ 0.4)')
    button.dataset.emphasis = 'strong'
    expect(colors()[2]).toContain('/ 0.88)')
    await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] })
    expect(colors()[2]).toContain('/ 0.76)')
    button.dataset.emphasis = 'soft'
    await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] })
    for (const nativeDisabled of [true, false]) {
      button.disabled = nativeDisabled
      if (!nativeDisabled) button.dataset.status = 'disabled'
      expect(colors()[0]).toContain('/ 0.48)')
      expect(colors()[1]).toContain('/ 0.48)')
      expect(colors()[2]).toContain('/ 0.2112)')
    }
    button.disabled = false
    delete button.dataset.status
    await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] })
    button.style.setProperty(source.toCSSString(), 'oklch(0.6 0.2 20)')
    expect(colors()).not.toEqual(hovered)
    expect(colors()[2]).toBe('oklch(0.6 0.2 20 / 0.32)')
    await userEvent.unhover(button)
    expect(colors()[2]).toBe('oklch(0.6 0.2 20 / 0.22)')
    button.style.setProperty(source.toCSSString(), 'oklch(0.6 0.2 20 / 0.5)')
    expect(colors()[0]).toContain('/ 0.07)')
    expect(colors()[2]).toContain('/ 0.11)')
    style.remove()
    expect(getComputedStyle(button).borderTopColor).not.toBe('oklch(0.6 0.2 20 / 0.22)')
  } finally {
    document.documentElement.removeAttribute('data-theme')
    button.remove()
    style.remove()
  }
})

test('中性材料的局部强调跟随根主题，邻居保持自己的状态', () => {
  const style = document.createElement('style')
  const content = variableFrom(colorContent, colorContent.content, { name: 'neutral-content', address: '.NeutralParts' })
  const surface = variableFrom(colorSurface, colorSurface.content, { name: 'neutral-surface', address: '.NeutralParts' })
  const boundary = variableFrom(colorBoundary, colorBoundary.content, { name: 'neutral-boundary', address: '.NeutralParts' })
  style.textContent = compileRules([
    [['.NeutralParts'], 'color', content],
    [['.NeutralParts'], 'background-color', surface],
    [['.NeutralParts'], 'border-color', boundary],
  ])
  const host = document.createElement('div')
  host.innerHTML = '<div class="NeutralParts" data-emphasis="soft"></div><div class="NeutralParts" data-emphasis="strong"></div>'
  document.head.append(style)
  document.body.append(host)
  const colors = (element: Element) => {
    const computed = getComputedStyle(element)
    return [computed.color, computed.backgroundColor, computed.borderTopColor]
  }
  try {
    const [soft, strong] = [...host.children]
    const light = colors(soft)
    expect(colors(strong).every((color, index) => color !== light[index])).toBe(true)
    document.documentElement.dataset.theme = 'dark'
    expect(colors(soft).every((color, index) => color !== light[index])).toBe(true)
    expect(colors(strong).every((color, index) => color !== colors(soft)[index])).toBe(true)
  } finally {
    document.documentElement.removeAttribute('data-theme')
    host.remove()
    style.remove()
  }
})
