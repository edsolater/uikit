/** 字号、字重、行高的固定尺度与可覆盖取值。 */
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'

/** 常规字号的固定 Value，单位为像素。 */
export const baseNormalTextSize = value('14px')

/** 大档字号的固定 Value，单位为像素。 */
export const baseLargeTextSize = value('16px')

/** 超大档字号的固定 Value，单位为像素。 */
export const baseXlargeTextSize = value('20px')

/** 标题字号的固定 Value，单位为像素。 */
export const baseHeadingTextSize = value('24px')

/** 常规字重的固定 Value。 */
export const normalFontWeight = value(400)

/** 粗体字重的固定 Value。 */
export const boldFontWeight = value(700)

/** 单倍行高的固定 Value；无单位，表示字号的一倍。 */
export const singleLineHeight = value(1)

/** 可覆盖的常规字号 Variable，默认读取常规固定尺度。 */
export const normalTextSize = variable('font-size-md', { root: { value: baseNormalTextSize } })

/** 可覆盖的大档字号 Variable，默认读取大档固定尺度。 */
export const largeTextSize = variable('font-size-lg', { root: { value: baseLargeTextSize } })

/** 可覆盖的超大档字号 Variable，默认读取超大档固定尺度。 */
export const xlargeTextSize = variable('font-size-xl', { root: { value: baseXlargeTextSize } })

/** 可覆盖的标题字号 Variable，默认读取标题固定尺度。 */
export const headingTextSize = variable('font-size-2xl', { root: { value: baseHeadingTextSize } })

/** 组件级字号 Variable，未局部重定义时读取大档字号。 */
export const controlTextSize = variable('component-font-size', { fallback: largeTextSize })

/** 组件级字重 Variable，未局部重定义时读取常规字重。 */
export const textWeight = variable('component-font-weight', { fallback: normalFontWeight })

/** 组件级行高 Variable，未局部重定义时读取单倍行高。 */
export const textLineHeight = variable('component-line-height', { fallback: singleLineHeight })
