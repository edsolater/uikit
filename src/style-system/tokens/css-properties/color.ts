/** 文字与背景颜色。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { toValue, type Value } from '../../core/css-value'

export const colorKey = key('color')
/** 文字前景色。 */
export const color = (input: Value | string): Declaration<'color'> => declaration(colorKey, toValue(input))

export const backgroundColorKey = key('background-color')
/** 元素底色，不影响背景图片。 */
export const backgroundColor = (input: Value | string): Declaration<'background-color'> =>
  declaration(backgroundColorKey, toValue(input))
