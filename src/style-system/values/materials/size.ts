/** 控件尺寸档位及最小高度覆盖入口。 */
import { variable } from '../../core/css-variable'
import { px32, px48, px64, px80 } from './space'

/** 小号控件尺寸，与内容间距独立调整。 */
export const smallControlSize = variable('size-3', { root: { value: px32 } })

/** 常规档控件尺寸。 */
export const normalControlSize = variable('size-5', { root: { value: px48 } })

/** 大档控件尺寸。 */
export const largeControlSize = variable('size-7', { root: { value: px64 } })

/** 超大档控件尺寸。 */
export const xlargeControlSize = variable('size-8', { root: { value: px80 } })

/** 控件最小高度，默认采用普通尺寸档。 */
export const minimumHeight = variable('component-min-height', { fallback: normalControlSize })
