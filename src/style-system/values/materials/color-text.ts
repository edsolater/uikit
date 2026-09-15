/** 默认文字色及可独立覆盖的交互文字色。 */
import { variable } from '../../core/css-variable'
import { ink, strongInk } from './color-palette'

/** 普通文字色。 */
export const defaultForegroundColor = variable('color-fg', { root: { value: ink } })

/** 强调文字色。 */
export const strongDefaultForegroundColor = variable('color-fg-strong', { root: { value: strongInk } })

/** 前景文字色；交互态未单独覆盖时沿用共同前景，再回退到强调文字色。 */
export const foregroundColor = variable('fg', {
  fallback: defaultForegroundColor,
  registration: { syntax: '*', inherits: true }
})

/** 悬停文字色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const foregroundHoverColor = variable('fg-hover', {
  fallback: variable('fg', { fallback: strongDefaultForegroundColor }),
  registration: { syntax: '*', inherits: true }
})

/** 按下文字色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const foregroundActiveColor = variable('fg-active', {
  fallback: variable('fg', { fallback: strongDefaultForegroundColor }),
  registration: { syntax: '*', inherits: true }
})
