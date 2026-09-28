/** 字号、字重、行高的固定尺度与可覆盖取值。 */
import { value } from '../../../value'
import { variable } from '../../../variable'

/** 常规字重的固定 Value。 */
export const regular = value(400)

/** 粗体字重的固定 Value。 */
export const bold = value(700)

/** 单倍行高的固定 Value；无单位，表示字号的一倍。 */
export const singleLine = value(1)

/** 可覆盖的常规字号 Variable。 */
export const textSizeNormal = variable('14px', { name: 'text-size-normal' })

/** 可覆盖的大档字号 Variable。 */
export const textSizeLarge = variable('16px', { name: 'text-size-large' })

/** 可覆盖的超大档字号 Variable。 */
export const textSizeExtraLarge = variable('20px', { name: 'text-size-extra-large' })

/** 可覆盖的超超大档字号 Variable。 */
export const textSizeExtraExtraLarge = variable('24px', { name: 'text-size-extra-extra-large' })
