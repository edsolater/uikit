/** 尺寸档位及最小高度覆盖入口。 */
import { variable } from '../../core/css-variable'

/** 可覆盖的小档尺寸 Variable，与内容间距独立调整。 */
export const small = variable('size-scale-3', { root: { value: '32px' } })

/** 可覆盖的常规档尺寸 Variable。 */
export const normal = variable('size-scale-5', { root: { value: '48px' } })

/** 可覆盖的大档尺寸 Variable。 */
export const large = variable('size-scale-7', { root: { value: '64px' } })

/** 可覆盖的超大档尺寸 Variable。 */
export const extraLarge = variable('size-scale-8', { root: { value: '80px' } })
