/** 间距档位、边界尺寸及控件内部空间。 */
import { variable } from '../core/css-variable'

/** 可覆盖的小档间距 Variable；可用于内外边距或内容间隔。 */
export const spaceSmall = variable(undefined, { name: 'space-small', root: { value: '4px' } })

/** 可覆盖的常规档间距 Variable。 */
export const spaceNormal = variable(undefined, { name: 'space-normal', root: { value: '8px' } })

/** 可覆盖的中档间距 Variable。 */
export const spaceMedium = variable(undefined, { name: 'space-medium', root: { value: '12px' } })

/** 可覆盖的大档间距 Variable。 */
export const spaceLarge = variable(undefined, { name: 'space-large', root: { value: '16px' } })

/** 可覆盖的超大档间距 Variable。 */
export const spaceExtraLarge = variable(undefined, { name: 'space-extra-large', root: { value: '24px' } })

/** 可覆盖的宽档间距 Variable。 */
export const spaceWide = variable(undefined, { name: 'space-wide', root: { value: '32px' } })

/** 可覆盖的最宽档间距 Variable。 */
export const spaceWidest = variable(undefined, { name: 'space-widest', root: { value: '48px' } })

/** 细边缘厚度；不与按压位移共享 Value。 */
export const boundaryWidthThin = variable(undefined, { name: 'boundary-width-thin', root: { value: '1px' } })

/** 焦点轮廓宽度。 */
export const focusStrokeWidth = variable(undefined, { name: 'focus-stroke-width', root: { value: '2px' } })

/** 焦点轮廓与控件之间的距离；与轮廓宽度独立。 */
export const focusGapSize = variable(undefined, { name: 'focus-gap-size', root: { value: '2px' } })
