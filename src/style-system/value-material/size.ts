/** 尺寸档位及最小高度覆盖入口。 */
import { variable } from '../core/css-variable'

/** 可覆盖的小档尺寸 Variable，与内容间距独立调整。 */
export const smallSize = variable(undefined, { name: 'small-size', root: { value: '32px' } })

/** 可覆盖的常规档尺寸 Variable。 */
export const normalSize = variable(undefined, { name: 'normal-size', root: { value: '48px' } })

/** 可覆盖的大档尺寸 Variable。 */
export const largeSize = variable(undefined, { name: 'large-size', root: { value: '64px' } })

/** 可覆盖的超大档尺寸 Variable。 */
export const extraLargeSize = variable(undefined, { name: 'extra-large-size', root: { value: '80px' } })
