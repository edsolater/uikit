/** 实心动作配色及完整交互取值。 */
import { variable } from '../../core/css-variable'
import { value } from '../../core/css-value'
import { whenHover, whenActive } from '../../selectors/msic'
import { brand, strongInk } from './color-palette'
import { colorMix } from '../functions/color-mix'

/** 实心动作底色。 */
export const primaryActionColor = variable('color-action', { root: { value: brand } })

/** 交互混色随主题改变明暗方向。 */
const actionShade = variable('color-action-shade', { root: { value: 'black', dark: 'white' } })

/** 动作底色对应的文字色。 */
export const actionForegroundColor = variable('color-action-fg', { root: { value: 'white', dark: strongInk } })

/** 可覆盖的实心动作底色配方；default、hover 与 active 分别拥有可局部重定义的 Variable Key。 */
export const actionColor = variable('action-color', {
  fallback: value(primaryActionColor, [
    [whenHover, colorMix([primaryActionColor, 0.9], actionShade)],
    [whenActive, colorMix([primaryActionColor, 0.8], 'black')],
  ]),
  registration: { syntax: '*', inherits: true }
})
