/** 实心动作配色及各交互状态的覆盖入口。 */
import { variable } from '../../core/css-variable'
import { brand, strongInk } from './color-palette'
import { colorMix } from '../functions/color-mix'

/** 实心动作底色。 */
export const primaryActionColor = variable('color-action', { root: { value: brand } })

/** 悬停动作色，随主题调亮或调暗。 */
export const primaryHoverColor = variable('color-action-hover', {
  root: {
    value: colorMix([primaryActionColor, 0.9], 'black'),
    dark: colorMix([primaryActionColor, 0.9], 'white'),
  },
})

/** 按下动作色。 */
export const primaryActiveColor = variable('color-action-active', {
  root: {
    value: colorMix([primaryActionColor, 0.8], 'black'),
  },
})

/** 动作底色对应的文字色。 */
export const actionForegroundColor = variable('color-action-fg', { root: { value: 'white', dark: strongInk } })

/** 实心动作底色；各状态可单独覆盖，也可由共同动作色统一覆盖。 */
export const actionColor = variable('action-color', {
  fallback: primaryActionColor,
  registration: { syntax: '*', inherits: true }
})

/** 悬停动作色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const actionHoverColor = variable('action-color-hover', {
  fallback: variable('action-color', { fallback: primaryHoverColor }),
  registration: { syntax: '*', inherits: true }
})

/** 按下动作色；优先使用状态覆盖，再回退到共同取值与状态默认值。 */
export const actionActiveColor = variable('action-color-active', {
  fallback: variable('action-color', { fallback: primaryActiveColor }),
  registration: { syntax: '*', inherits: true }
})
