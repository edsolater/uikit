/** 空间长度、间距档位及内边距覆盖入口；长度不绑定某个 CSS 属性。 */
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'

/** 一像素的固定 Value，可用于细边缘或微小位移。 */
export const px1 = value('1px')

/** 2 像素的固定空间 Value。 */
export const px2 = value('2px')

/** 4 像素的固定空间 Value。 */
export const px4 = value('4px')

/** 8 像素的固定空间 Value。 */
export const px8 = value('8px')

/** 12 像素的固定空间 Value。 */
export const px12 = value('12px')

/** 16 像素的固定空间 Value。 */
export const px16 = value('16px')

/** 24 像素的固定空间 Value。 */
export const px24 = value('24px')

/** 32 像素的固定空间 Value。 */
export const px32 = value('32px')

/** 48 像素的固定空间 Value。 */
export const px48 = value('48px')

/** 64 像素的固定空间 Value。 */
export const px64 = value('64px')

/** 80 像素的固定空间 Value。 */
export const px80 = value('80px')

/** 可覆盖的小档间距 Variable；可用于内外边距或内容间隔。 */
export const smallSpace = variable('space-2', { root: { value: px4 } })

/** 可覆盖的常规档间距 Variable。 */
export const normalSpace = variable('space-3', { root: { value: px8 } })

/** 可覆盖的中档间距 Variable。 */
export const mediumSpace = variable('space-4', { root: { value: px12 } })

/** 可覆盖的大档间距 Variable。 */
export const largeSpace = variable('space-5', { root: { value: px16 } })

/** 可覆盖的超大档间距 Variable。 */
export const xlargeSpace = variable('space-6', { root: { value: px24 } })

/** 可覆盖的宽档间距 Variable。 */
export const wideSpace = variable('space-7', { root: { value: px32 } })

/** 可覆盖的最宽档间距 Variable。 */
export const widestSpace = variable('space-8', { root: { value: px48 } })

/** 可覆盖的微小距离 Variable，默认一像素，可用于细边缘或位移。 */
export const thinDistance = variable('boundary-1', { root: { value: px1 } })

/** 可覆盖的焦点边缘厚度 Variable。 */
export const focusOutlineThickness = variable('boundary-2', { root: { value: px2 } })

/** 组件级横向内边距 Variable，默认采用超大档间距。 */
export const horizontalPadding = variable('component-padding-x', { fallback: xlargeSpace })

/** 组件级纵向内边距 Variable，默认采用常规档间距。 */
export const verticalPadding = variable('component-padding-y', { fallback: normalSpace })

/** 组件级内容间隔 Variable，与四周内边距分开控制。 */
export const contentGap = variable('component-gap', { fallback: normalSpace })
