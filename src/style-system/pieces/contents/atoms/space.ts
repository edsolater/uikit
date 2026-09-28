/** 间距档位、边界尺寸及控件内部空间。 */
import { variable } from '../../../variable'

/** 可覆盖的小档间距 Variable；可用于内外边距或内容间隔。 */
export const spaceSmall = variable('4px', { name: 'space-small' })

/** 可覆盖的常规档间距 Variable。 */
export const spaceNormal = variable('8px', { name: 'space-normal' })

/** 可覆盖的中档间距 Variable。 */
export const spaceMedium = variable('12px', { name: 'space-medium' })

/** 可覆盖的大档间距 Variable。 */
export const spaceLarge = variable('16px', { name: 'space-large' })

/** 可覆盖的超大档间距 Variable。 */
export const spaceExtraLarge = variable('24px', { name: 'space-extra-large' })

/** 可覆盖的宽档间距 Variable。 */
export const spaceWide = variable('32px', { name: 'space-wide' })

/** 可覆盖的最宽档间距 Variable。 */
export const spaceWidest = variable('48px', { name: 'space-widest' })

/** 细边缘厚度；不与按压位移共享 Value。 */
export const boundaryWidthThin = variable('1px', { name: 'boundary-width-thin' })

/** 焦点轮廓宽度。 */
export const focusStrokeWidth = variable('2px', { name: 'focus-stroke-width' })

/** 焦点轮廓与控件之间的距离；与轮廓宽度独立。 */
export const focusGapSize = variable('2px', { name: 'focus-gap-size' })
