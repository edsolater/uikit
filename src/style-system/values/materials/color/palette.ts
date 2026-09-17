/** 明暗基础色板及中性色元，为各类配色提供共同来源。 */
import { value } from '../../../core/css-value'
import { variable } from '../../../core/css-variable'

/** 明暗两套基础色板，提供品牌色、中性色和危险色。 */
export const palette = {
  brand: { light: value('oklch(58% 0.2 260)'), dark: value('oklch(70% 0.18 260)') },
  paper: { light: value('oklch(98% 0.003 260)'), dark: value('oklch(13% 0.01 260)') },
  lowSurface: { light: value('oklch(94.5% 0.006 260)'), dark: value('oklch(17% 0.012 260)') },
  hoverSurface: { light: value('oklch(90% 0.008 260)'), dark: value('oklch(22% 0.014 260)') },
  activeSurface: { light: value('oklch(84% 0.008 260)'), dark: value('oklch(31% 0.014 260)') },
  ink: { light: value('oklch(26% 0.005 260)'), dark: value('oklch(87% 0.006 260)') },
  strongInk: { light: value('oklch(15% 0.004 260)'), dark: value('oklch(96% 0.004 260)') },
  danger: { light: value('#c42b1c'), dark: value('oklch(70% 0.18 28)') },
}

/** 品牌基础色，随根元素的明暗主题切换，并为语义颜色提供可覆盖色元。 */
export const brand = variable('color-brand', { root: { value: palette.brand.light, dark: palette.brand.dark } })

/** 亮色主题的纸面底色。 */
const paperSurface = variable('dye-neutral-0', { root: { value: palette.paper.light, dark: palette.paper.dark } })

/** 低层中性表面。 */
export const lowSurface = variable('dye-neutral-1', { root: { value: palette.lowSurface.light, dark: palette.lowSurface.dark } })

/** 悬停时的中性表面。 */
export const hoverSurface = variable('dye-neutral-2', {
  root: {
    value: palette.hoverSurface.light,
    dark: palette.hoverSurface.dark,
  },
})

/** 按下时的中性表面。 */
export const activeSurface = variable('dye-neutral-3', {
  root: {
    value: palette.activeSurface.light,
    dark: palette.activeSurface.dark,
  },
})

/** 普通文字的基础色元。 */
export const ink = variable('dye-neutral-7', { root: { value: palette.ink.light, dark: palette.ink.dark } })

/** 强调文字的基础色元。 */
export const strongInk = variable('dye-neutral-8', { root: { value: palette.strongInk.light, dark: palette.strongInk.dark } })

/** 通用表面底色，暗色主题采用低层表面。 */
export const surface = variable('color-surface', { root: { value: paperSurface, dark: lowSurface } })
