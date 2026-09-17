/** 提供可覆盖的表面与背景配方，hover、active 与 disabled 取值与各自配方保持在一起。 */
import { baseSurfaceColor, lowSurfaceColor, defaultSurfaceHoverColor, defaultSurfaceActiveColor } from './color-palette'
import { variable } from '../../core/css-variable'
import { value } from '../../core/css-value'
import { whenHover, whenActive, whenDisabled } from '../../selectors/msic'
import { colorMix } from '../functions/color-mix'
import { accentSoftColor } from './color-tone'
import { defaultForegroundColor } from './color-text'

/** 轻量悬停底色中的前景色占比，范围为零至一。 */
const hoverForegroundRatio = 0.08

/** 轻量按下底色中的前景色占比，范围为零至一。 */
const activeForegroundRatio = 0.14

/** 可覆盖的中性表面配方；default、hover 与 active 分别拥有可局部重定义的 Variable Key。 */
export const surfaceColor = variable('surface-color', {
  fallback: value(lowSurfaceColor, [[whenHover, defaultSurfaceHoverColor], [whenActive, defaultSurfaceActiveColor]]),
  registration: { syntax: '*', inherits: true }
})

/** 可覆盖的轻强调背景配方；每个 Condition Key 缺少局部定义时读取该状态的混色值。 */
export const bgColor = variable('bg', {
  fallback: value(colorMix([surfaceColor, 0.82], accentSoftColor), [
    [whenHover, colorMix([surfaceColor, 0.72], accentSoftColor)],
    [whenActive, colorMix([surfaceColor, 0.62], accentSoftColor)],
    [whenDisabled, baseSurfaceColor],
  ]),
  registration: { syntax: '*', inherits: true }
})

/** 悬停底色，使用低占比前景色与透明色混合。 */
export const hoverOverlayColor = colorMix([defaultForegroundColor, hoverForegroundRatio], 'transparent')

/** 按下底色，前景色占比高于悬停时。 */
export const activeOverlayColor = colorMix([defaultForegroundColor, activeForegroundRatio], 'transparent')

/** 透明动作背景；悬停和按下时分别显示轻量前景覆盖色。 */
export const transparentInteractionColor = value('transparent', [
  [whenHover, hoverOverlayColor],
  [whenActive, activeOverlayColor],
])
