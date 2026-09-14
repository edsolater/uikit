/** 边缘、阴影和焦点颜色的共享覆盖入口。 */
import { variable } from '../../core/css-variable'
import { radii } from '../values/dimension'
import { colorMix } from '../values/color-mix'
import { mixWeights } from '../values/opacity'
import { colors } from './color'
import { shadows } from './elevation'

/** 圆角半径，未覆盖时采用小圆角。 */
export const radius = variable('component-radius', { fallback: radii.small })

/** 边缘颜色，默认使用半透明分隔线色。 */
export const borderColor = variable('component-border-color', {
  fallback: colorMix([colors.line, mixWeights.border], 'transparent'),
})

/** 焦点提示色，默认采用强调色系。 */
export const focusColor = variable('component-focus-color', { fallback: colors.accentFocus })

/** 普通态阴影；hover、active 优先读各自覆盖值，再读共同覆盖值，最后采用状态默认阴影。 */
export const shadow = Object.assign(variable('component-shadow', { fallback: shadows.low }), {
  hover: variable('component-shadow-hover', { fallback: variable('component-shadow', { fallback: shadows.raised }) }),
  active: variable('component-shadow-active', { fallback: variable('component-shadow', { fallback: shadows.flat }) }),
})
