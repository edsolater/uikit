/**
 * 动作用途的颜色变量与颜色族。
 *
 * 交互状态和高亮变化引用当前品牌颜色，族成员由共享生成器提供。
 *
 * 用途配方留在样式层，局部品牌覆盖由浏览器继续传递。
 */
import { token, type Token, type TokenInput } from '../../../../token'
import { add, multiply } from '../../functions/calc'
import { oklch } from '../../functions/oklch'
import { brandColor } from './brand-color'
import { interactiveColorStates } from './ui-token-state'
import { paperColor } from './palette'
import { globalSurfaceColor } from './colors'

/** 控件颜色的用途配方；交互由输入拥有，各用途读取输入的最终颜色。 */
export const controlColor = token(brandColor, {
  name: 'control-color',
})

export const interactiveColor = token(
  interactiveColorStates({ base: brandColor, chromaResponse: 1 }),
  'interactive-color',
)

/** 中性承载面的交互只改变明度，保持全局表面的彩度。 */
export const interactiveSurfaceColor = token(
  interactiveColorStates({ base: globalSurfaceColor }),
  'interactive-surface-color',
)

/** 动作色混入承载面的占比；状态相对于组件实际选定的基础占比。 */
export const surfaceStrength = token(0.18, {
  name: 'surface-strength',
  state: {
    hover: (base) => multiply(base, 0.28 / 0.18),
    active: (base) => multiply(base, 0.38 / 0.18),
  },
})

/** 高亮色在当前品牌颜色上增加明度和彩度，并将色相偏移 -18°。 */
export const highlightColor = token(
  oklch(brandColor, {
    lightness: (current) => add(current, 0.04),
    chroma: (current) => add(current, 0.01),
    hue: (current) => add(current, -18),
  }),
  'highlight-color',
)

/**
 * 承载面用途读取来源当前颜色并降低透明度，状态仍由来源控制。
 */
export const controlSurfaceColor = (base: Token<TokenInput> = controlColor) =>
  token(oklch(base, { alpha: (current) => multiply(current, 0.14) }), {
    name: `${base.name ?? 'control'}-surface`,
    address: base.address,
  })

/**
 * 文字用途直接引用来源当前颜色，沿用明确的计算地址。
 */
export const controlTextColor = (base: Token<TokenInput> = controlColor) =>
  token(base, { name: `${base.name ?? 'control'}-text`, address: base.address })

/**
 * 边线用途读取来源当前颜色，使用独立的透明度公式。
 */
export const controlLineColor = (base: Token<TokenInput> = controlColor) =>
  token(oklch(base, { alpha: (current) => multiply(current, 0.44) }), {
    name: `${base.name ?? 'control'}-boundary`,
    address: base.address,
  })

/**
 * 控件内容用途引用共享纸色，与控件的交互状态独立。
 */
export const controlContentColor = () => token(paperColor, 'control-content')
