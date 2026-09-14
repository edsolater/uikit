/** 默认、悬停和按下状态的共享颜色变量。 */
import { variable } from '../../core/css-variable'
import type { Value } from '../../core/css-value'
import { colorMix } from '../values/color-mix'
import { colors } from './color'

/** 用 '*' 注册且不设初值，让未赋值的变量仍能使用 fallback。 */
function inheritedVariable(name: string, fallback: Value) {
  return variable(name, { fallback, registration: { syntax: '*', inherits: true } })
}

/** 中性表面色；悬停、按下优先使用状态覆盖，再回退到共同表面色和状态默认色。 */
export const surfaceColor = Object.assign(inheritedVariable('surface-color', colors.low), {
  hover: inheritedVariable('surface-color-hover', variable('surface-color', { fallback: colors.hoverSurface })),
  active: inheritedVariable('surface-color-active', variable('surface-color', { fallback: colors.activeSurface })),
})

/** 带轻微强调色的背景；各状态优先读自身覆盖，再读共同背景，最后采用混色配方。 */
export const bgColor = Object.assign(inheritedVariable('bg', colorMix([surfaceColor, 0.82], colors.accentSoft)), {
  hover: inheritedVariable(
    'bg-hover',
    variable('bg', { fallback: colorMix([surfaceColor.hover, 0.72], colors.accentSoft) }),
  ),
  active: inheritedVariable(
    'bg-active',
    variable('bg', { fallback: colorMix([surfaceColor.active, 0.62], colors.accentSoft) }),
  ),
})

/** 前景文字色；交互态未单独覆盖时沿用共同前景，再回退到强调文字色。 */
export const fgColor = Object.assign(inheritedVariable('fg', colors.fg), {
  hover: inheritedVariable('fg-hover', variable('fg', { fallback: colors.fgStrong })),
  active: inheritedVariable('fg-active', variable('fg', { fallback: colors.fgStrong })),
})

/** 实心动作底色；各状态可单独覆盖，也可由共同动作色统一覆盖。 */
export const actionColor = Object.assign(inheritedVariable('action-color', colors.action), {
  hover: inheritedVariable('action-color-hover', variable('action-color', { fallback: colors.actionHover })),
  active: inheritedVariable('action-color-active', variable('action-color', { fallback: colors.actionActive })),
})
