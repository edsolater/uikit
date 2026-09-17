/** 不占布局空间的轮廓。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type ValueInput } from '../core/css-value'

/** outline-width 声明的属性位置。 */
export const outlineWidthKey = key('outline-width')
/** 创建 outline-width Declaration，设置轮廓线厚度。 */
export const outlineWidth = (input: ValueInput): Declaration<'outline-width'> =>
  declaration(outlineWidthKey, toValue(input))

/** outline-style 声明的属性位置。 */
export const outlineStyleKey = key('outline-style')
/** 创建 outline-style Declaration，设置轮廓线型。 */
export const outlineStyle = (input: ValueInput): Declaration<'outline-style'> =>
  declaration(outlineStyleKey, toValue(input))

/** outline-color 声明的属性位置。 */
export const outlineColorKey = key('outline-color')
/** 创建 outline-color Declaration，设置轮廓颜色。 */
export const outlineColor = (input: ValueInput): Declaration<'outline-color'> =>
  declaration(outlineColorKey, toValue(input))

/** outline-offset 声明的属性位置。 */
export const outlineOffsetKey = key('outline-offset')
/** 创建 outline-offset Declaration；设置轮廓与元素边缘的间隔，负值向内收。 */
export const outlineOffset = (input: ValueInput): Declaration<'outline-offset'> =>
  declaration(outlineOffsetKey, toValue(input))
