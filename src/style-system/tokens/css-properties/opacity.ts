/** 元素的整体透明度。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { toValue, type Value } from '../../core/css-value'

export const opacityKey = key('opacity')
/** 整体不透明度，内容与背景一起变化。 */
export const opacity = (input: Value | string): Declaration<'opacity'> => declaration(opacityKey, toValue(input))
