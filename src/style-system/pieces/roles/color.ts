/** 组件共享的颜色角色。

保存承载面与内容颜色，并配置完整颜色规则的应用方式。

组件按自身选择器声明角色，复用普通 Variable 的作用域与修改能力。
*/
import { variable } from '../../variable'
import { applyColorModification } from '../contents/functions/color-modification'
import { surfaceColor as defaultSurfaceColor, foregroundColor as defaultForegroundColor } from '../contents/atoms/color/colors'

/** 组件承载面的当前颜色，由组件规则在自身选择器中声明。 */
export const surfaceColor = variable(defaultSurfaceColor, { name: 'component-surface-color', modification: { apply: applyColorModification } })

/** 组件内容的当前颜色，由组件规则在自身选择器中声明。 */
export const foregroundColor = variable(defaultForegroundColor, { name: 'component-foreground-color', modification: { apply: applyColorModification } })
