/** 从品牌与中性色元派生语义颜色，并提供状态自适应的表面、背景和前景。 */
import { cssColorMix } from '../core/css-color'
import { cssVariable } from '../core/css-variable'
import { token } from './token'

const brand = token('base-brand', 'oklch(58% 0.2 260)', { dark: 'oklch(70% 0.18 260)' })
const paper = token('dye-neutral-0', 'oklch(98% 0.003 260)', { dark: 'oklch(13% 0.01 260)' })
const low = token('dye-neutral-1', 'oklch(94.5% 0.006 260)', { dark: 'oklch(17% 0.012 260)' })
const hoverSurface = token('dye-neutral-2', 'oklch(90% 0.008 260)', { dark: 'oklch(22% 0.014 260)' })
const activeSurface = token('dye-neutral-3', 'oklch(84% 0.008 260)', { dark: 'oklch(31% 0.014 260)' })
const ink = token('dye-neutral-7', 'oklch(26% 0.005 260)', { dark: 'oklch(87% 0.006 260)' })
const strongInk = token('dye-neutral-8', 'oklch(15% 0.004 260)', { dark: 'oklch(96% 0.004 260)' })
const surface = token('color-surface', paper, { dark: low })
const fg = token('color-fg', ink)
const fgStrong = token('color-fg-strong', strongInk)
const action = token('color-action', brand)
const actionHover = token('color-action-hover', cssColorMix([action, 0.9], 'black'), {
  dark: cssColorMix([action, 0.9], 'white'),
})
const actionActive = token('color-action-active', cssColorMix([action, 0.8], 'black'))
const actionFg = token('color-action-fg', 'white', { dark: strongInk })
const accent = token('color-accent', cssColorMix([brand, 0.8], 'cyan'))
const accentSoft = token('color-accent-soft', cssColorMix([accent, 0.14], 'transparent'))
const accentFg = token('color-accent-fg', actionFg)
const accentFocus = token('color-accent-focus', cssColorMix([accent, 0.42], 'transparent'))
const bad = token('color-bad', '#c42b1c', { dark: 'oklch(70% 0.18 28)' })
const badSoft = token('color-bad-soft', cssColorMix([bad, 0.14], 'transparent'))
const badFg = token('color-bad-fg', actionFg)
const badLine = token('color-bad-line', cssColorMix([bad, 0.44], 'transparent'))
const line = token('color-line', cssColorMix([fg, 0.18], 'transparent'))

export const cssColor = {
  surface,
  fg,
  fgStrong,
  action,
  actionHover,
  actionActive,
  actionFg,
  accent,
  accentSoft,
  accentFg,
  accentFocus,
  bad,
  badSoft,
  badFg,
  badLine,
  line,
}

const smartSurface = cssVariable('surface-color', {
  value: { default: low, hover: hoverSurface, active: activeSurface },
})
const bg = cssVariable('bg', {
  property: { syntax: '<color>', inherits: true, initialValue: 'transparent' },
  value: {
    default: cssColorMix([smartSurface, 0.82], accentSoft),
    hover: cssColorMix([smartSurface, 0.72], accentSoft),
    active: cssColorMix([smartSurface, 0.62], accentSoft),
  },
})
const smartFg = cssVariable('fg', { value: { default: fg, hover: fgStrong, active: fgStrong } })
const smartAction = cssVariable('action-color', {
  value: { default: action, hover: actionHover, active: actionActive },
})

export const cssBaseVariable = { surface: smartSurface, bg, fg: smartFg, action: smartAction }
