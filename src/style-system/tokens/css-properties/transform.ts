/** 元素变换及保留距离引用的位移值。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { joinValues, toValue, type Value } from '../../core/css-value'

export const transformKey = key('transform')
/** 平移、缩放等视觉变换，不改变原有布局占位。 */
export const transform = (input: Value | string): Declaration<'transform'> => declaration(transformKey, toValue(input))

/** 纵向位移；正值向下，负值向上。 */
export const translateY = (distance: Value): Value => joinValues('', 'translateY(', distance, ')')
