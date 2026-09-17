/** 间距档位、边界尺寸及控件内部空间。 */
import { variable } from '../../core/css-variable'

/** 可覆盖的小档间距 Variable；可用于内外边距或内容间隔。 */
export const smallSpace = variable('space-scale-2', { root: { value: '4px' } })

/** 可覆盖的常规档间距 Variable。 */
export const normalSpace = variable('space-scale-3', { root: { value: '8px' } })

/** 可覆盖的中档间距 Variable。 */
export const mediumSpace = variable('space-scale-4', { root: { value: '12px' } })

/** 可覆盖的大档间距 Variable。 */
export const largeSpace = variable('space-scale-5', { root: { value: '16px' } })

/** 可覆盖的超大档间距 Variable。 */
export const extraLargeSpace = variable('space-scale-6', { root: { value: '24px' } })

/** 可覆盖的宽档间距 Variable。 */
export const wideSpace = variable('space-scale-7', { root: { value: '32px' } })

/** 可覆盖的最宽档间距 Variable。 */
export const widestSpace = variable('space-scale-8', { root: { value: '48px' } })

/** 细边缘厚度；不与按压位移共享 Value。 */
export const thinBoundary = variable('boundary-thickness-thin', { root: { value: '1px' } })

/** 焦点轮廓宽度。 */
export const focusStroke = variable('boundary-focus-width', { root: { value: '2px' } })

/** 焦点轮廓与控件之间的距离；与轮廓宽度独立。 */
export const focusGap = variable('space-focus-offset', { root: { value: '2px' } })

/** 横向内边距 Variable，默认采用超大档间距。 */
export const paddingInline = variable('space-padding-inline', { fallback: extraLargeSpace })

/** 纵向内边距 Variable，默认采用常规档间距。 */
export const paddingBlock = variable('space-padding-block', { fallback: normalSpace })

/** 内容间隔 Variable，与四周内边距分开控制。 */
export const gap = variable('space-gap', { fallback: normalSpace })
