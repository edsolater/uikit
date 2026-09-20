/** 主体焦点反馈的配色角色。 */
import { variable } from '../core/css-variable'
import { accentColor } from '../value-material/color/tone'

export const focusColor = variable(accentColor('focus'), { name: 'focus-color' })
