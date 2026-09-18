/** 提供可覆盖的文字前景色，并在定义处保存 hover、active 与 disabled 的完整取值。 */
import { variable } from '../../../core/css-variable'
import { value } from '../../../core/css-value'
import { ink, strongInk } from './palette'

/** 普通文字色。 */
export const foreground = variable('color-foreground', { root: { value: ink } })

/** 强调文字色。 */
export const strongForeground = variable('color-foreground-strong', { root: { value: strongInk } })

/** 可交互内容的前景色；交互时增强，禁用时恢复普通前景。 */
export const interactiveForeground = value(foreground, {
  hover: strongForeground,
  active: strongForeground,
  disabled: foreground,
})
