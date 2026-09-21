/** 中性承载面与透明覆盖色，交互取值与各自材料保持在一起。 */
import { neutralColor } from './neutral'
import { variable } from '../../core/css-variable'
import { colorMix } from '../../values/functions/color-mix'
import { textColor } from './text'

/** 通用承载面；明暗主题与局部覆盖由基础 CSS 的语义 token 决定。 */
export const surfaceColor = variable('var(--color-surface)', { name: 'surface-color' })

/** 中性表面；同名变量随交互状态切换。 */
export const surfaceColorInteractive = variable(neutralColor(1), {
  name: 'surface-color-interactive', registration: { syntax: '*', inherits: true }, states: {
    hover: neutralColor(2),
    active: neutralColor(3),
  }
})

/** 轻量悬停底色中的前景色占比，范围为零至一。 */
const hoverOverlayRatio = 0.08

/** 悬停底色，使用低占比前景色与透明色混合。 */
export const hoverOverlay = colorMix([textColor, hoverOverlayRatio], 'transparent')

/** 轻量按下底色中的前景色占比，范围为零至一。 */
const activeOverlayRatio = 0.14

/** 按下底色，前景色占比高于悬停时。 */
export const activeOverlay = colorMix([textColor, activeOverlayRatio], 'transparent')
