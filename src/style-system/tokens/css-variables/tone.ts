/** 语气颜色及其底色配比，具体语气由使用规则定义。 */
import { variable } from '../../core/css-variable'
import { colorMix } from '../values/color-mix'
import { mixWeights } from '../values/opacity'
import { colors } from './color'

/** 语气主色，默认采用强调色。 */
export const toneColor = variable('component-tone-color', { fallback: colors.accent })

/** 低浓度语气色，用于与表面底色混合。 */
export const toneSoftColor = variable('component-tone-soft-color', { fallback: colors.accentSoft })

/** 语气交互态的前景色。 */
export const toneForeground = variable('component-tone-foreground', { fallback: colors.accentFg })

/** 语气底色；悬停和按下逐步增加语气色占比，各状态仍可单独覆盖。 */
export const toneBackground = Object.assign(
  variable('component-tone-background', {
    fallback: colorMix([colors.surface, mixWeights.surface], toneSoftColor),
  }),
  {
    hover: variable('component-tone-background-hover', {
      fallback: variable('component-tone-background', {
        fallback: colorMix([colors.surface, mixWeights.surfaceHover], toneSoftColor),
      }),
    }),
    active: variable('component-tone-background-active', {
      fallback: variable('component-tone-background', {
        fallback: colorMix([colors.surface, mixWeights.surfaceActive], toneSoftColor),
      }),
    }),
  },
)
