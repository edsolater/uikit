/** 字号、字重、行高的固定尺度与可覆盖取值。 */
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'

/** 常规字重的固定 Value。 */
export const regular = value(400)

/** 粗体字重的固定 Value。 */
export const bold = value(700)

/** 单倍行高的固定 Value；无单位，表示字号的一倍。 */
export const singleLine = value(1)

/** 可覆盖的常规字号 Variable，默认读取常规固定尺度。 */
export const normalText = variable('font-size-normal', { root: { value: '14px' } })

/** 可覆盖的大档字号 Variable，默认读取大档固定尺度。 */
export const largeText = variable('font-size-large', { root: { value: '16px' } })

/** 可覆盖的超大档字号 Variable，默认读取超大档固定尺度。 */
export const extraLargeText = variable('font-size-extra-large', { root: { value: '20px' } })

/** 可覆盖的标题字号 Variable，默认读取标题固定尺度。 */
export const heading = variable('font-size-heading', { root: { value: '24px' } })
