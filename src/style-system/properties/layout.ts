/** 排列方式与对齐 CSS Key。 */
import { key } from '../core/css-key'

/** display Key，设置元素采用的布局方式。 */
export const $display = key('display')

/** align-items Key；弹性布局中控制子项沿交叉轴的对齐。 */
export const $alignItems = key('align-items')

/** align-self Key；为单个子项覆盖容器的统一对齐。 */
export const $alignSelf = key('align-self')

/** justify-content Key；弹性布局中控制内容沿主轴的分布与对齐。 */
export const $justifyContent = key('justify-content')

/** gap Key；设置子项间隔，不包含容器内边距。 */
export const $gap = key('gap')
