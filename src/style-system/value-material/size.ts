/** 尺寸档位及最小高度覆盖入口。 */
import { variable } from '../core/css-variable'

/** 可覆盖的小档尺寸 Variable，与内容间距独立调整。 */
export const controlSizeSmall = variable(undefined, { name: 'control-size-small', root: { value: '32px' } })

/** 可覆盖的常规档尺寸 Variable。 */
export const controlSizeNormal = variable(undefined, { name: 'control-size-normal', root: { value: '48px' } })

/** 可覆盖的大档尺寸 Variable。 */
export const controlSizeLarge = variable(undefined, { name: 'control-size-large', root: { value: '64px' } })

/** 可覆盖的超大档尺寸 Variable。 */
export const controlSizeExtraLarge = variable(undefined, { name: 'control-size-extra-large', root: { value: '80px' } })
