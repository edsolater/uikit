/** 动作用途的颜色变量与颜色族。
 *
 * 交互状态和高亮变化引用当前品牌颜色，族成员由共享生成器提供。
 *
 * 用途配方留在样式层，局部品牌覆盖由浏览器继续传递。
 */
import { variable, variableFrom } from '../../../../variable'
import { add, multiply } from '../../functions/calc'
import { oklch } from '../../functions/oklch'
import { brandColor } from './brand-color'
import { interactiveColorStates } from './ui-variable-structure'
import { paperColor } from './palette'
import { globalSurfaceColor } from './colors'

/** 控件颜色的用途配方；交互由输入拥有，各用途读取输入的最终颜色。 */
export const controlColor = variable(brandColor, {
  name: 'control-color',
  variants: {
    surface: base => oklch(base, { alpha: current => multiply(current, 0.14) }),
    text: base => base,
    boundary: base => oklch(base, { alpha: current => multiply(current, 0.44) }),
    content: paperColor,
  },
})

export const interactiveColor = variableFrom(controlColor,
  interactiveColorStates({ base: brandColor, chromaResponse: 1 }),
  'interactive-color',
)

/** 中性承载面的交互只改变明度，保持全局表面的彩度。 */
export const interactiveSurfaceColor = variable(interactiveColorStates({ base: globalSurfaceColor }), 'interactive-surface-color')

/** 动作色混入承载面的占比；状态相对于组件实际选定的基础占比。 */
export const surfaceStrength = variable(0.18, {
  name: 'surface-strength',
  states: { hover: base => multiply(base, 0.28 / 0.18), active: base => multiply(base, 0.38 / 0.18) },
})

/** 高亮色在当前品牌颜色上增加明度和彩度，并将色相偏移 -18°。 */
export const highlightColor = variable(
  oklch(brandColor, {
    lightness: current => add(current, 0.04),
    chroma: current => add(current, 0.01),
    hue: current => add(current, -18),
  }),
  'highlight-color',
)
