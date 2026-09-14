/** 品牌与中性色在明暗主题中的基础取值。 */
import { value } from '../core/css-value'

/** 明暗两套基础色板，提供品牌色、中性色和危险色。 */
export const palette = {
  brand: { light: value('oklch(58% 0.2 260)'), dark: value('oklch(70% 0.18 260)') },
  paper: { light: value('oklch(98% 0.003 260)'), dark: value('oklch(13% 0.01 260)') },
  low: { light: value('oklch(94.5% 0.006 260)'), dark: value('oklch(17% 0.012 260)') },
  hoverSurface: { light: value('oklch(90% 0.008 260)'), dark: value('oklch(22% 0.014 260)') },
  activeSurface: { light: value('oklch(84% 0.008 260)'), dark: value('oklch(31% 0.014 260)') },
  ink: { light: value('oklch(26% 0.005 260)'), dark: value('oklch(87% 0.006 260)') },
  strongInk: { light: value('oklch(15% 0.004 260)'), dark: value('oklch(96% 0.004 260)') },
  bad: { light: value('#c42b1c'), dark: value('oklch(70% 0.18 28)') },
}
