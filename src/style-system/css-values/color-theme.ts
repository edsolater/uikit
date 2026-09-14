/** 品牌与中性色元派生的语义颜色，保留根主题和局部覆盖；混色权重均为零至一的比例。 */
import { variable } from '../core/css-variable'
import { palette } from './color-palette'
import { colorMix } from './color-mix'

// 基础色板随根主题切换，语义颜色继续引用这些可覆盖的色元。
const brand = variable('base-brand', { root: { value: palette.brand.light, dark: palette.brand.dark } })

/** 亮色主题的纸面底色。 */
const paper = variable('dye-neutral-0', { root: { value: palette.paper.light, dark: palette.paper.dark } })

/** 低层中性表面。 */
export const lowSurfaceColor = variable('dye-neutral-1', { root: { value: palette.low.light, dark: palette.low.dark } })

/** 悬停时的中性表面。 */
export const hoverSurfaceColor = variable('dye-neutral-2', {
  root: {
    value: palette.hoverSurface.light,
    dark: palette.hoverSurface.dark,
  },
})

/** 按下时的中性表面。 */
export const activeSurfaceColor = variable('dye-neutral-3', {
  root: {
    value: palette.activeSurface.light,
    dark: palette.activeSurface.dark,
  },
})

/** 普通文字的基础色元。 */
const ink = variable('dye-neutral-7', { root: { value: palette.ink.light, dark: palette.ink.dark } })

/** 强调文字的基础色元。 */
const strongInk = variable('dye-neutral-8', { root: { value: palette.strongInk.light, dark: palette.strongInk.dark } })

/** 通用表面底色，暗色主题采用低层表面。 */
export const baseSurfaceColor = variable('color-surface', { root: { value: paper, dark: lowSurfaceColor } })

/** 普通文字色。 */
export const foregroundColor = variable('color-fg', { root: { value: ink } })

/** 强调文字色。 */
export const strongForegroundColor = variable('color-fg-strong', { root: { value: strongInk } })

/** 实心动作底色。 */
export const primaryActionColor = variable('color-action', { root: { value: brand } })

/** 悬停动作色，随主题调亮或调暗。 */
export const primaryHoverColor = variable('color-action-hover', {
  root: {
    value: colorMix([primaryActionColor, 0.9], 'black'),
    dark: colorMix([primaryActionColor, 0.9], 'white'),
  },
})

/** 按下动作色。 */
export const primaryActiveColor = variable('color-action-active', {
  root: {
    value: colorMix([primaryActionColor, 0.8], 'black'),
  },
})

/** 动作底色对应的文字色。 */
export const actionForegroundColor = variable('color-action-fg', { root: { value: 'white', dark: strongInk } })

/** 强调主色。 */
export const accentColor = variable('color-accent', { root: { value: colorMix([brand, 0.8], 'cyan') } })

/** 淡强调色，用于轻量底色或边缘。 */
export const accentSoftColor = variable('color-accent-soft', {
  root: {
    value: colorMix([accentColor, 0.14], 'transparent'),
  },
})

/** 强调语气的前景色。 */
export const accentForegroundColor = variable('color-accent-fg', { root: { value: actionForegroundColor } })

/** 强调语气的焦点提示色。 */
export const accentFocusColor = variable('color-accent-focus', {
  root: {
    value: colorMix([accentColor, 0.42], 'transparent'),
  },
})

/** 危险主色。 */
export const dangerColor = variable('color-bad', { root: { value: palette.bad.light, dark: palette.bad.dark } })

/** 淡危险色，用于轻量底色或边缘。 */
export const dangerSoftColor = variable('color-bad-soft', {
  root: {
    value: colorMix([dangerColor, 0.14], 'transparent'),
  },
})

/** 危险语气的前景色。 */
export const dangerForegroundColor = variable('color-bad-fg', { root: { value: actionForegroundColor } })

/** 危险语气的边缘提示色。 */
export const dangerLineColor = variable('color-bad-line', {
  root: {
    value: colorMix([dangerColor, 0.44], 'transparent'),
  },
})

/** 中性分隔线色。 */
export const lineColor = variable('color-line', { root: { value: colorMix([foregroundColor, 0.18], 'transparent') } })
