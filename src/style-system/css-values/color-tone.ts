/** 语气颜色及其底色配比，具体语气由使用规则定义。 */
import { variable } from '../core/css-variable'
import { colorMix } from './color-mix'
import { mixWeights } from './opacity'
import { baseSurfaceColor, accentColor, accentSoftColor, accentForegroundColor } from './color-theme'

/** 语气主色，默认采用强调色。 */
export const toneColor = variable('component-tone-color', { fallback: accentColor })

/** 低浓度语气色，用于与表面底色混合。 */
export const toneSoftColor = variable('component-tone-soft-color', { fallback: accentSoftColor })

/** 语气交互态的前景色。 */
export const toneForeground = variable('component-tone-foreground', { fallback: accentForegroundColor })

/** 语气底色；悬停和按下逐步增加语气色占比，各状态仍可单独覆盖。 */
export const toneBackground = variable('component-tone-background', {
  fallback: colorMix([baseSurfaceColor, mixWeights.surface], toneSoftColor),
})

/** 悬停语气底色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const toneHoverBackground = variable('component-tone-background-hover', {
  fallback: variable('component-tone-background', {
    fallback: colorMix([baseSurfaceColor, mixWeights.surfaceHover], toneSoftColor),
  }),
})

/** 按下语气底色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const toneActiveBackground = variable('component-tone-background-active', {
  fallback: variable('component-tone-background', {
    fallback: colorMix([baseSurfaceColor, mixWeights.surfaceActive], toneSoftColor),
  }),
})
