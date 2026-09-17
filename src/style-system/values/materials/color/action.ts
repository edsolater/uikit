/** 实心动作配色及完整交互取值。 */
import { variable } from '../../../core/css-variable'
import { value } from '../../../core/css-value'
import { whenHover, whenActive } from '../../../selectors/interaction'
import { brand, strongInk } from './palette'
import { colorMix } from '../../functions/color-mix'

/** 实心动作底色。 */
export const action = variable('color-action', { root: { value: brand } })

/** 交互混色随主题改变明暗方向。 */
const actionShade = variable('color-action-shade', { root: { value: 'black', dark: 'white' } })

/** 动作底色对应的文字色。 */
export const actionForeground = variable('color-action-foreground', { root: { value: 'white', dark: strongInk } })

/** 可覆盖的实心动作底色配方；default、hover 与 active 分别拥有可局部重定义的 Variable Key。 */
export const actionSurface = variable('color-action-background', {
  fallback: value(action, [
    [whenHover, colorMix([action, 0.9], actionShade)],
    [whenActive, colorMix([action, 0.8], 'black')],
  ]),
  registration: { syntax: '*', inherits: true }
})
