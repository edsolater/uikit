/** 组件共享的颜色角色。

保存承载面与内容颜色，完整规则自己提供修改方式。

组件按自身选择器声明角色，复用普通 Variable 的作用域与修改能力。
*/
import { variable } from '../../variable'
import { globalSurfaceColor, globalContentColor } from '../contents/atoms/color/colors'

/** 组件承载面的当前颜色，由组件规则在自身选择器中声明。 */
export const surfaceColor = variable(globalSurfaceColor, 'component-surface-color')

/** 组件内容的当前颜色，由组件规则在自身选择器中声明。 */
export const contentColor = variable(globalContentColor, 'component-content-color')
