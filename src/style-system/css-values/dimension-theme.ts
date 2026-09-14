/** 可局部覆盖的间距、尺寸和边界厚度。 */
import { variable } from '../core/css-variable'
import { px1, px2, px32, px48, px64, px80, px4, px8, px12, px16, px24 } from './dimension-scale'

/** 小档间距；与其他档位一样，可用于内外边距或内容间隔。 */
export const smallSpace = variable('space-2', { root: { value: px4 } })

/** 常规档间距。 */
export const normalSpace = variable('space-3', { root: { value: px8 } })

/** 中档间距。 */
export const mediumSpace = variable('space-4', { root: { value: px12 } })

/** 大档间距。 */
export const largeSpace = variable('space-5', { root: { value: px16 } })

/** 超大档间距。 */
export const xlargeSpace = variable('space-6', { root: { value: px24 } })

/** 宽档间距。 */
export const wideSpace = variable('space-7', { root: { value: px32 } })

/** 最宽档间距。 */
export const widestSpace = variable('space-8', { root: { value: px48 } })

/** 小号控件尺寸，与内容间距独立调整。 */
export const smallSize = variable('size-3', { root: { value: px32 } })

/** 常规档控件尺寸。 */
export const normalSize = variable('size-5', { root: { value: px48 } })

/** 大档控件尺寸。 */
export const largeSize = variable('size-7', { root: { value: px64 } })

/** 超大档控件尺寸。 */
export const xlargeSize = variable('size-8', { root: { value: px80 } })

/** 细边界厚度，可供边缘或微小位移使用。 */
export const thinBoundary = variable('boundary-1', { root: { value: px1 } })

/** 焦点提示的边缘厚度。 */
export const focusBoundary = variable('boundary-2', { root: { value: px2 } })
