/** 鼠标指针与文本选择。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type Value } from '../core/css-value'

export const cursorKey = key('cursor')
/** 鼠标经过时的指针形态。 */
export const cursor = (input: Value | string): Declaration<'cursor'> => declaration(cursorKey, toValue(input))

export const userSelectKey = key('user-select')
/** 文本能否被用户选中。 */
export const userSelect = (input: Value | string): Declaration<'user-select'> =>
  declaration(userSelectKey, toValue(input))
