/** 控件尺寸档位及最小高度覆盖入口。 */
import { variable } from '../../core/css-variable'
import { px32, px48, px64, px80 } from './space'

/** 可覆盖的小号控件尺寸 Variable，与内容间距独立调整。 */
export const smallControlSize = variable('size-3', { root: { value: px32 } })

/** 可覆盖的常规档控件尺寸 Variable。 */
export const normalControlSize = variable('size-5', { root: { value: px48 } })

/** 可覆盖的大档控件尺寸 Variable。 */
export const largeControlSize = variable('size-7', { root: { value: px64 } })

/** 可覆盖的超大档控件尺寸 Variable。 */
export const xlargeControlSize = variable('size-8', { root: { value: px80 } })

/** 组件级最小高度 Variable，未局部重定义时读取常规控件尺寸。 */
export const minimumHeight = variable('component-min-height', { fallback: normalControlSize })
