/** 表面、背景及轻量交互覆盖色；状态覆盖优先于共同取值。 */
import { lowSurfaceColor, defaultSurfaceHoverColor, defaultSurfaceActiveColor } from './color-palette'
import { variable } from '../../core/css-variable'
import { colorMix } from '../functions/color-mix'
import { accentSoftColor } from './color-tone'
import { defaultForegroundColor } from './color-text'

/** 轻量悬停底色中的前景色占比，范围为零至一。 */
const hoverForegroundRatio = 0.08

/** 轻量按下底色中的前景色占比，范围为零至一。 */
const activeForegroundRatio = 0.14

/** 中性表面色；悬停、按下优先使用状态覆盖，再回退到共同表面色和状态默认色。 */
export const surfaceColor = variable('surface-color', {
  fallback: lowSurfaceColor,
  registration: { syntax: '*', inherits: true }
})

/** 悬停表面色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const surfaceHoverColor = variable('surface-color-hover', {
  fallback: variable('surface-color', { fallback: defaultSurfaceHoverColor }),
  registration: { syntax: '*', inherits: true }
})

/** 按下表面色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const surfaceActiveColor = variable('surface-color-active', {
  fallback: variable('surface-color', { fallback: defaultSurfaceActiveColor }),
  registration: { syntax: '*', inherits: true }
})

/** 带轻微强调色的背景；各状态优先读自身覆盖，再读共同背景，最后采用混色配方。 */
export const bgColor = variable('bg', {
  fallback: colorMix([surfaceColor, 0.82], accentSoftColor),
  registration: { syntax: '*', inherits: true }
})

/** 悬停背景色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const bgHoverColor = variable('bg-hover', {
  fallback: variable('bg', { fallback: colorMix([surfaceHoverColor, 0.72], accentSoftColor) }),
  registration: { syntax: '*', inherits: true }
})

/** 按下背景色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const bgActiveColor = variable('bg-active', {
  fallback: variable('bg', { fallback: colorMix([surfaceActiveColor, 0.62], accentSoftColor) }),
  registration: { syntax: '*', inherits: true }
})

/** 悬停底色，使用低占比前景色与透明色混合。 */
export const hoverOverlayColor = colorMix([defaultForegroundColor, hoverForegroundRatio], 'transparent')

/** 按下底色，前景色占比高于悬停时。 */
export const activeOverlayColor = colorMix([defaultForegroundColor, activeForegroundRatio], 'transparent')
