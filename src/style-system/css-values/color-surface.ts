/** 默认、悬停和按下状态的共享颜色变量；混色权重均为零至一的比例。 */
import { variable } from '../core/css-variable'
import type { Value } from '../core/css-value'
import { colorMix } from './color-mix'
import {
  lowSurfaceColor,
  hoverSurfaceColor,
  activeSurfaceColor,
  foregroundColor,
  strongForegroundColor,
  primaryActionColor,
  primaryHoverColor,
  primaryActiveColor,
  accentSoftColor,
} from './color-theme'

/** 用 '*' 注册且不设初值，让未赋值的变量仍能使用 fallback。 */
function inheritedVariable(name: string, fallback: Value) {
  return variable(name, { fallback, registration: { syntax: '*', inherits: true } })
}

/** 中性表面色；悬停、按下优先使用状态覆盖，再回退到共同表面色和状态默认色。 */
export const surfaceColor = inheritedVariable('surface-color', lowSurfaceColor)

/** 悬停表面色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const surfaceHoverColor = inheritedVariable('surface-color-hover', variable('surface-color', { fallback: hoverSurfaceColor }))

/** 按下表面色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const surfaceActiveColor = inheritedVariable('surface-color-active', variable('surface-color', { fallback: activeSurfaceColor }))

/** 带轻微强调色的背景；各状态优先读自身覆盖，再读共同背景，最后采用混色配方。 */
export const bgColor = inheritedVariable('bg', colorMix([surfaceColor, 0.82], accentSoftColor))

/** 悬停背景色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const bgHoverColor = inheritedVariable(
  'bg-hover',
  variable('bg', { fallback: colorMix([surfaceHoverColor, 0.72], accentSoftColor) }),
)

/** 按下背景色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const bgActiveColor = inheritedVariable(
  'bg-active',
  variable('bg', { fallback: colorMix([surfaceActiveColor, 0.62], accentSoftColor) }),
)

/** 前景文字色；交互态未单独覆盖时沿用共同前景，再回退到强调文字色。 */
export const fgColor = inheritedVariable('fg', foregroundColor)

/** 悬停文字色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const fgHoverColor = inheritedVariable('fg-hover', variable('fg', { fallback: strongForegroundColor }))

/** 按下文字色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const fgActiveColor = inheritedVariable('fg-active', variable('fg', { fallback: strongForegroundColor }))

/** 实心动作底色；各状态可单独覆盖，也可由共同动作色统一覆盖。 */
export const actionColor = inheritedVariable('action-color', primaryActionColor)

/** 悬停动作色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const actionHoverColor = inheritedVariable('action-color-hover', variable('action-color', { fallback: primaryHoverColor }))

/** 按下动作色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const actionActiveColor = inheritedVariable('action-color-active', variable('action-color', { fallback: primaryActiveColor }))
