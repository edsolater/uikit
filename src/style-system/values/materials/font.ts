/** 字号、字重、行高的固定尺度与可覆盖取值。 */
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'

/** 常规字号的固定尺度，单位为像素。 */
export const baseNormalTextSize = value('14px')

/** 大档字号。 */
export const baseLargeTextSize = value('16px')

/** 超大档字号。 */
export const baseXlargeTextSize = value('20px')

/** 标题字号。 */
export const baseHeadingTextSize = value('24px')

/** 常规字重。 */
export const normalFontWeight = value(400)

/** 粗体字重。 */
export const boldFontWeight = value(700)

/** 单倍行高，无单位，为字号的一倍。 */
export const singleLineHeight = value(1)

/** 可覆盖的常规字号。 */
export const normalTextSize = variable('font-size-md', { root: { value: baseNormalTextSize } })

/** 大档字号。 */
export const largeTextSize = variable('font-size-lg', { root: { value: baseLargeTextSize } })

/** 超大档字号。 */
export const xlargeTextSize = variable('font-size-xl', { root: { value: baseXlargeTextSize } })

/** 标题字号。 */
export const headingTextSize = variable('font-size-2xl', { root: { value: baseHeadingTextSize } })

/** 组件字号，默认采用大号文字档。 */
export const controlTextSize = variable('component-font-size', { fallback: largeTextSize })

/** 组件字重，未覆盖时使用常规字重。 */
export const textWeight = variable('component-font-weight', { fallback: normalFontWeight })

/** 组件行高，默认与字号等高。 */
export const textLineHeight = variable('component-line-height', { fallback: singleLineHeight })
