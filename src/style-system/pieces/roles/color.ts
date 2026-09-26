/** 组件主体可共同声明的颜色角色，不预设具体组件的视觉配方。 */
import { variable } from '../../variable'

/** 组件承载面的当前颜色，由组件规则在自身选择器中声明。 */
export const surfaceColor = variable(undefined, { name: 'component-surface-color' })

/** 组件内容的当前颜色，由组件规则在自身选择器中声明。 */
export const foregroundColor = variable(undefined, { name: 'component-foreground-color' })
