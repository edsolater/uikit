/** 元素变换属性，消费独立的变换值。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type Value } from '../core/css-value'

export const transformKey = key('transform')
/** 平移、缩放等视觉变换，不改变原有布局占位。 */
export const transform = (input: Value | string): Declaration<'transform'> => declaration(transformKey, toValue(input))
