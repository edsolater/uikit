/** 中性承载面与透明覆盖色，交互取值与各自材料保持在一起。 */
import { paletteColor } from './palette'
import { variable } from '../../core/css-variable'
import { value } from '../../core/css-value'
import { colorMix } from '../../values/functions/color-mix'
import { foreground } from './text'

/** 轻量悬停底色中的前景色占比，范围为零至一。 */
const hoverOverlayRatio = 0.08

/** 轻量按下底色中的前景色占比，范围为零至一。 */
const activeOverlayRatio = 0.14

/** 通用承载面；明暗主题与局部覆盖由基础 CSS 的语义 token 决定。 */
export const surface = variable('color-surface')

/** 中性表面；同名变量随交互状态切换。 */
export const interactiveSurface = variable('color-surface-interactive', {
  fallback: value(paletteColor('neutral', 1), {
    hover: paletteColor('neutral', 2),
    active: paletteColor('neutral', 3),
  }),
  registration: { syntax: '*', inherits: true }
})

/** 悬停底色，使用低占比前景色与透明色混合。 */
export const hoverOverlay = colorMix([foreground, hoverOverlayRatio], 'transparent')

/** 按下底色，前景色占比高于悬停时。 */
export const activeOverlay = colorMix([foreground, activeOverlayRatio], 'transparent')
