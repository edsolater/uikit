/** 元素变换属性，消费独立的变换值。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type ValueInput } from '../core/css-value'

/** transform 声明的属性位置，可供 Rule 或过渡条目引用。 */
export const transformKey = key('transform')
/** 创建 transform Declaration；平移、缩放等视觉变换不改变原有布局占位。 */
export const transform = (input: ValueInput): Declaration<'transform'> => declaration(transformKey, toValue(input))
