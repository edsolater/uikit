/** 强调、危险及可由使用规则定义的语气配色。 */
import { variable } from '../../core/css-variable'
import { value } from '../../core/css-value'
import { whenHover, whenActive } from '../../selectors/msic'
import { colorMix } from '../functions/color-mix'
import { brand, palette, baseSurfaceColor } from './color-palette'
import { actionForegroundColor } from './color-action'

/** 语气底色中的表面色占比，范围为零至一。 */
const toneSurfaceRatio = 0.76

/** 悬停时减少表面色占比，让语气色更明显。 */
const toneHoverSurfaceRatio = 0.66

/** 按下时进一步减少表面色占比。 */
const toneActiveSurfaceRatio = 0.56

/** 强调主色。 */
export const accentColor = variable('color-accent', { root: { value: colorMix([brand, 0.8], 'cyan') } })

/** 淡强调色，用于轻量底色或边缘。 */
export const accentSoftColor = variable('color-accent-soft', {
  root: {
    value: colorMix([accentColor, 0.14], 'transparent'),
  },
})

/** 强调语气的前景色。 */
export const accentForegroundColor = variable('color-accent-fg', { root: { value: actionForegroundColor } })

/** 强调语气的焦点提示色。 */
export const accentFocusColor = variable('color-accent-focus', {
  root: {
    value: colorMix([accentColor, 0.42], 'transparent'),
  },
})

/** 危险主色。 */
export const dangerColor = variable('color-bad', { root: { value: palette.danger.light, dark: palette.danger.dark } })

/** 淡危险色，用于轻量底色或边缘。 */
export const dangerSoftColor = variable('color-bad-soft', {
  root: {
    value: colorMix([dangerColor, 0.14], 'transparent'),
  },
})

/** 危险语气的前景色。 */
export const dangerForegroundColor = variable('color-bad-fg', { root: { value: actionForegroundColor } })

/** 危险语气的边缘提示色。 */
export const dangerLineColor = variable('color-bad-line', {
  root: {
    value: colorMix([dangerColor, 0.44], 'transparent'),
  },
})

/** 语气主色，默认采用强调色。 */
export const toneColor = variable('component-tone-color', { fallback: accentColor })

/** 低浓度语气色，用于与表面底色混合。 */
export const toneSoftColor = variable('component-tone-soft-color', { fallback: accentSoftColor })

/** 语气交互态的前景色。 */
export const toneForeground = variable('component-tone-foreground', { fallback: accentForegroundColor })

/** 可覆盖的语气底色配方；default、hover 与 active 分别拥有可局部重定义的 Variable Key。 */
export const toneBackground = variable('component-tone-background', {
  fallback: value(colorMix([baseSurfaceColor, toneSurfaceRatio], toneSoftColor), [
    [whenHover, colorMix([baseSurfaceColor, toneHoverSurfaceRatio], toneSoftColor)],
    [whenActive, colorMix([baseSurfaceColor, toneActiveSurfaceRatio], toneSoftColor)],
  ]),
})
