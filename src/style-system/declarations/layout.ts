/** 排列方式与对齐。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type ValueInput } from '../core/css-value'

/** display 声明的属性位置。 */
export const displayKey = key('display')
/** 创建 display Declaration，设置元素采用的布局方式。 */
export const display = (input: ValueInput): Declaration<'display'> => declaration(displayKey, toValue(input))

/** align-items 声明的属性位置。 */
export const alignItemsKey = key('align-items')
/** 创建 align-items Declaration；弹性布局中控制子项沿交叉轴的对齐。 */
export const alignItems = (input: ValueInput): Declaration<'align-items'> =>
  declaration(alignItemsKey, toValue(input))

/** align-self 声明的属性位置。 */
export const alignSelfKey = key('align-self')
/** 创建 align-self Declaration；为单个子项覆盖容器的统一对齐。 */
export const alignSelf = (input: ValueInput): Declaration<'align-self'> => declaration(alignSelfKey, toValue(input))

/** justify-content 声明的属性位置。 */
export const justifyContentKey = key('justify-content')
/** 创建 justify-content Declaration；弹性布局中控制内容沿主轴的分布与对齐。 */
export const justifyContent = (input: ValueInput): Declaration<'justify-content'> =>
  declaration(justifyContentKey, toValue(input))

/** gap 声明的属性位置。 */
export const gapKey = key('gap')
/** 创建 gap Declaration；设置子项间隔，不包含容器内边距。 */
export const gap = (input: ValueInput): Declaration<'gap'> => declaration(gapKey, toValue(input))
