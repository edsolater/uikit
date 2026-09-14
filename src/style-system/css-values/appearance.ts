/** 边缘、阴影和焦点颜色的共享覆盖入口。 */
import { variable } from '../core/css-variable'
import { smallRadius } from './dimension-scale'
import { colorMix } from './color-mix'
import { mixWeights } from './opacity'
import { accentFocusColor, lineColor } from './color-theme'
import { flatShadow, lowShadow, raisedShadow } from './shadow-theme'

/** 圆角半径，未覆盖时采用小圆角。 */
export const cornerRadius = variable('component-radius', { fallback: smallRadius })

/** 边缘颜色，默认使用半透明分隔线色。 */
export const edgeColor = variable('component-border-color', {
  fallback: colorMix([lineColor, mixWeights.border], 'transparent'),
})

/** 焦点提示色，默认采用强调色系。 */
export const focusColor = variable('component-focus-color', { fallback: accentFocusColor })

/** 普通态阴影；hover、active 优先读各自覆盖值，再读共同覆盖值，最后采用状态默认阴影。 */
export const shadow = variable('component-shadow', { fallback: lowShadow })

/** 悬停阴影；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const hoverShadow = variable('component-shadow-hover', { fallback: variable('component-shadow', { fallback: raisedShadow }) })

/** 按下阴影；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const activeShadow = variable('component-shadow-active', { fallback: variable('component-shadow', { fallback: flatShadow }) })
