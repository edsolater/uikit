/** 引用基础 CSS token 的文字前景色，并保存交互取值；使用前须加载基础颜色样式。 */
import { variable } from '../../../core/css-variable'
import { value } from '../../../core/css-value'

/** 普通文字色。 */
export const foreground = variable('color-fg')

/** 强调文字色。 */
export const strongForeground = variable('color-fg-strong')

/** 可交互内容的前景色；交互时增强，禁用时恢复普通前景。 */
export const interactiveForeground = value(foreground, {
  hover: strongForeground,
  active: strongForeground,
  disabled: foreground,
})
