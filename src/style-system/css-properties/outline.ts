/** 不占布局空间的轮廓。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type Value } from '../core/css-value'

export const outlineWidthKey = key('outline-width')
/** 轮廓线厚度。 */
export const outlineWidth = (input: Value | string): Declaration<'outline-width'> =>
  declaration(outlineWidthKey, toValue(input))

export const outlineStyleKey = key('outline-style')
/** 轮廓线型。 */
export const outlineStyle = (input: Value | string): Declaration<'outline-style'> =>
  declaration(outlineStyleKey, toValue(input))

export const outlineColorKey = key('outline-color')
/** 轮廓颜色。 */
export const outlineColor = (input: Value | string): Declaration<'outline-color'> =>
  declaration(outlineColorKey, toValue(input))

export const outlineOffsetKey = key('outline-offset')
/** 轮廓与元素边缘的间隔；负值向内收。 */
export const outlineOffset = (input: Value | string): Declaration<'outline-offset'> =>
  declaration(outlineOffsetKey, toValue(input))
