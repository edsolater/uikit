/** 元素的尺寸约束。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { toValue, type Value } from '../../core/css-value'

export const minHeightKey = key('min-height')
/** 最小高度，内容仍可将元素撑高。 */
export const minHeight = (input: Value | string): Declaration<'min-height'> => declaration(minHeightKey, toValue(input))
