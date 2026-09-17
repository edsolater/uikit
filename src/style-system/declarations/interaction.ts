/** 鼠标指针与文本选择。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type ValueInput } from '../core/css-value'

/** cursor 声明的属性位置，可供 Rule 引用。 */
export const cursorKey = key('cursor')
/** 创建 cursor Declaration，描述鼠标经过元素时的指针形态。 */
export const cursor = (input: ValueInput): Declaration<'cursor'> => declaration(cursorKey, toValue(input))

/** user-select 声明的属性位置，可供 Rule 引用。 */
export const userSelectKey = key('user-select')
/** 创建 user-select Declaration，描述元素文本能否被用户选中。 */
export const userSelect = (input: ValueInput): Declaration<'user-select'> =>
  declaration(userSelectKey, toValue(input))
