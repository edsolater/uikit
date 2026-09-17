/** 文字与背景颜色。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type ValueInput } from '../core/css-value'

/** color 声明的属性位置，可供 Rule 或过渡条目引用。 */
export const colorKey = key('color')
/** 创建文字前景色 Declaration；输入保留为 Value，等待编译。 */
export const color = (input: ValueInput): Declaration<'color'> => declaration(colorKey, toValue(input))

/** background-color 声明的属性位置，可供 Rule 或过渡条目引用。 */
export const backgroundColorKey = key('background-color')
/** 创建元素底色 Declaration；只对应 background-color，不影响背景图片。 */
export const backgroundColor = (input: ValueInput): Declaration<'background-color'> =>
  declaration(backgroundColorKey, toValue(input))
