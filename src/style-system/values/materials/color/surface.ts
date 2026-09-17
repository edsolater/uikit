/** 中性承载面与透明覆盖色，交互取值与各自材料保持在一起。 */
import { lowSurface, hoverSurface, activeSurface } from './palette'
import { variable } from '../../../core/css-variable'
import { value } from '../../../core/css-value'
import { whenHover, whenActive } from '../../../selectors/msic'
import { colorMix } from '../../functions/color-mix'
import { foreground } from './text'

/** 轻量悬停底色中的前景色占比，范围为零至一。 */
const hoverOverlayRatio = 0.08

/** 轻量按下底色中的前景色占比，范围为零至一。 */
const activeOverlayRatio = 0.14

/** 可覆盖的中性表面配方；default、hover 与 active 分别拥有可局部重定义的 Variable Key。 */
export const interactiveSurface = variable('color-surface-interactive', {
  fallback: value(lowSurface, [[whenHover, hoverSurface], [whenActive, activeSurface]]),
  registration: { syntax: '*', inherits: true }
})

/** 悬停底色，使用低占比前景色与透明色混合。 */
export const hoverOverlay = colorMix([foreground, hoverOverlayRatio], 'transparent')

/** 按下底色，前景色占比高于悬停时。 */
export const activeOverlay = colorMix([foreground, activeOverlayRatio], 'transparent')
