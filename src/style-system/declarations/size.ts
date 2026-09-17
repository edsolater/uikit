/** 元素的尺寸约束。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type ValueInput } from '../core/css-value'

/** min-height 声明的属性位置，可供 Rule 或过渡条目引用。 */
export const minHeightKey = key('min-height')
/** 创建 min-height Declaration；内容仍可将元素撑高。 */
export const minHeight = (input: ValueInput): Declaration<'min-height'> => declaration(minHeightKey, toValue(input))
