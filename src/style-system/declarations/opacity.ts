/** 元素的整体透明度。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type ValueInput } from '../core/css-value'

/** opacity 声明的属性位置，可供 Rule 或过渡条目引用。 */
export const opacityKey = key('opacity')
/** 创建 opacity Declaration；内容与背景的不透明度一起变化。 */
export const opacity = (input: ValueInput): Declaration<'opacity'> => declaration(opacityKey, toValue(input))
