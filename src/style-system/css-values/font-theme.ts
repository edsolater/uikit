/** 可局部覆盖的字号阶梯。 */
import { variable } from '../core/css-variable'
import {
  baseNormalTextSize,
  baseLargeTextSize,
  baseXlargeTextSize,
  baseHeadingTextSize,
  normalWeight,
  singleLineHeight,
} from './font-scale'

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
export const textWeight = variable('component-font-weight', { fallback: normalWeight })

/** 组件行高，默认与字号等高。 */
export const textLineHeight = variable('component-line-height', { fallback: singleLineHeight })
