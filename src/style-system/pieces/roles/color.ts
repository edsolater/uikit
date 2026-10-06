/** 组件主体可共同声明的颜色角色，不预设具体组件的视觉配方。 */
import { colorVariable } from '../../color-variable'
import { surfaceColor as defaultSurfaceColor, foregroundColor as defaultForegroundColor } from '../contents/atoms/color/colors'

/** 组件承载面的当前颜色，由组件规则在自身选择器中声明。 */
export const surfaceColor = colorVariable(defaultSurfaceColor, { name: 'component-surface-color' })

/** 组件内容的当前颜色，由组件规则在自身选择器中声明。 */
export const foregroundColor = colorVariable(defaultForegroundColor, { name: 'component-foreground-color' })
