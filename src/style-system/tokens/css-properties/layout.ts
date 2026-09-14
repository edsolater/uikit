/** 排列方式与对齐。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { toValue, type Value } from '../../core/css-value'

export const displayKey = key('display')
/** 元素的布局方式。 */
export const display = (input: Value | string): Declaration<'display'> => declaration(displayKey, toValue(input))

export const alignItemsKey = key('align-items')
/** 子项的对齐方式；弹性布局中沿交叉轴生效。 */
export const alignItems = (input: Value | string): Declaration<'align-items'> =>
  declaration(alignItemsKey, toValue(input))

export const alignSelfKey = key('align-self')
/** 单个子项的对齐方式，覆盖容器的统一设置。 */
export const alignSelf = (input: Value | string): Declaration<'align-self'> => declaration(alignSelfKey, toValue(input))

export const justifyContentKey = key('justify-content')
/** 内容分布与对齐；弹性布局中沿主轴生效。 */
export const justifyContent = (input: Value | string): Declaration<'justify-content'> =>
  declaration(justifyContentKey, toValue(input))

export const gapKey = key('gap')
/** 子项之间的间隔，不包含容器内边距。 */
export const gap = (input: Value | string): Declaration<'gap'> => declaration(gapKey, toValue(input))

/** 行内弹性容器，内容双向居中；自身作为布局子项时也居中对齐。 */
export const inlineCenter = [
  display('inline-flex'),
  alignItems('center'),
  alignSelf('center'),
  justifyContent('center'),
]
