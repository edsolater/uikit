/** 品牌与中性色元派生的语义颜色，保留根主题和局部覆盖。 */
import { palette } from '../values/color'
import { colorMix } from '../values/color-mix'
import { token } from '../token'

// 基础色板随根主题切换，语义颜色继续引用这些可覆盖的色元。
const brand = token('base-brand', palette.brand.light, { dark: palette.brand.dark })
const paper = token('dye-neutral-0', palette.paper.light, { dark: palette.paper.dark })
const low = token('dye-neutral-1', palette.low.light, { dark: palette.low.dark })
const hoverSurface = token('dye-neutral-2', palette.hoverSurface.light, { dark: palette.hoverSurface.dark })
const activeSurface = token('dye-neutral-3', palette.activeSurface.light, { dark: palette.activeSurface.dark })
const ink = token('dye-neutral-7', palette.ink.light, { dark: palette.ink.dark })
const strongInk = token('dye-neutral-8', palette.strongInk.light, { dark: palette.strongInk.dark })

// 中性表面与文字形成基础对比关系。
const surface = token('color-surface', paper, { dark: low })
const fg = token('color-fg', ink)
const fgStrong = token('color-fg-strong', strongInk)

// 动作色的悬停分支随主题调整明暗，按下分支统一加深。
const action = token('color-action', brand)
const actionHover = token('color-action-hover', colorMix([action, 0.9], 'black'), {
  dark: colorMix([action, 0.9], 'white'),
})
const actionActive = token('color-action-active', colorMix([action, 0.8], 'black'))
const actionFg = token('color-action-fg', 'white', { dark: strongInk })

// 强调色与危险色各自提供主色、淡色、前景和边缘提示色。
const accent = token('color-accent', colorMix([brand, 0.8], 'cyan'))
const accentSoft = token('color-accent-soft', colorMix([accent, 0.14], 'transparent'))
const accentFg = token('color-accent-fg', actionFg)
const accentFocus = token('color-accent-focus', colorMix([accent, 0.42], 'transparent'))
const bad = token('color-bad', palette.bad.light, { dark: palette.bad.dark })
const badSoft = token('color-bad-soft', colorMix([bad, 0.14], 'transparent'))
const badFg = token('color-bad-fg', actionFg)
const badLine = token('color-bad-line', colorMix([bad, 0.44], 'transparent'))
const line = token('color-line', colorMix([fg, 0.18], 'transparent'))

/** 表面、文字、动作与语气的公共配色；各颜色保留局部覆盖入口。 */
export const colors = {
  /** 低层中性表面。 */
  low,
  /** 悬停时的中性表面。 */
  hoverSurface,
  /** 按下时的中性表面。 */
  activeSurface,
  /** 通用表面底色，暗色主题采用低层表面。 */
  surface,

  /** 普通文字色。 */
  fg,
  /** 强调文字色。 */
  fgStrong,

  /** 实心动作底色。 */
  action,
  /** 悬停动作色，随主题调亮或调暗。 */
  actionHover,
  /** 按下动作色。 */
  actionActive,
  /** 动作底色对应的文字色。 */
  actionFg,

  /** 强调主色。 */
  accent,
  /** 淡强调色，用于轻量底色或边缘。 */
  accentSoft,
  /** 强调语气的前景色。 */
  accentFg,
  /** 强调语气的焦点提示色。 */
  accentFocus,

  /** 危险主色。 */
  bad,
  /** 淡危险色，用于轻量底色或边缘。 */
  badSoft,
  /** 危险语气的前景色。 */
  badFg,
  /** 危险语气的边缘提示色。 */
  badLine,

  /** 中性分隔线色。 */
  line,
}
