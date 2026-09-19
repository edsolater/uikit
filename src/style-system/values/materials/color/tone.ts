/** 强调、危险及可由使用规则定义的语气配色；具体语气颜色引用已加载的基础 CSS token。 */
import { variable } from '../../../core/css-variable'
import { value } from '../../../core/css-value'
import { colorMix } from '../../functions/color-mix'
import { surface } from './surface'

/** 语气底色中的表面色占比，范围为零至一。 */
const toneSurfaceRatio = 0.76

/** 悬停时减少表面色占比，让语气色更明显。 */
const toneHoverSurfaceRatio = 0.66

/** 按下时进一步减少表面色占比。 */
const toneActiveSurfaceRatio = 0.56

/** 强调主色。 */
export const accent = variable('color-accent')

/** 淡强调底色上使用的强语气文字。 */
export const strongAccent = variable('color-accent-strong')

/** 淡强调色，用于轻量底色或边缘。 */
export const softAccent = variable('color-accent-soft')

/** 强调语气的前景色。 */
export const accentForeground = variable('color-accent-fg')

/** 强调语气的焦点提示色。 */
export const accentFocus = variable('color-accent-focus')

/** 危险主色。 */
export const danger = variable('color-bad')

/** 淡危险色，用于轻量底色或边缘。 */
export const softDanger = variable('color-bad-soft')

/** 危险语气的前景色。 */
export const dangerForeground = variable('color-bad-fg')

/** 危险语气的边缘提示色。 */
export const dangerLine = variable('color-bad-line')

/** 语气主色，默认采用强调色。 */
export const tone = variable('color-tone', { fallback: accent })

/** 低浓度语气色，用于与表面底色混合。 */
export const softTone = variable('color-tone-soft', { fallback: softAccent })

/** 淡语气底色对应的强文字色，由使用规则选择语气。 */
export const strongTone = variable('color-tone-strong', { fallback: strongAccent })

/** 语气交互态的前景色。 */
export const toneForeground = variable('color-tone-foreground', { fallback: accentForeground })

/** 语气底色；同名变量随交互状态切换。 */
export const toneSurface = variable('color-tone-background', {
  fallback: value(colorMix([surface, toneSurfaceRatio], softTone), {
    hover: colorMix([surface, toneHoverSurfaceRatio], softTone),
    active: colorMix([surface, toneActiveSurfaceRatio], softTone),
  }),
})
