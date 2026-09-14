/** 可局部覆盖的字号阶梯。 */
import { variable } from '../../core/css-variable'
import { fontSizes, fontWeights, lineHeights } from '../values/typography'
import { token } from '../token'

/** 可覆盖的字号阶梯，从普通文字到标题。 */
export const textSize = {
  normal: token('font-size-md', fontSizes.normal),
  large: token('font-size-lg', fontSizes.large),
  xlarge: token('font-size-xl', fontSizes.xlarge),
  heading: token('font-size-2xl', fontSizes.heading),
}

/** 组件字号，默认采用大号文字档。 */
export const fontSize = variable('component-font-size', { fallback: textSize.large })

/** 组件字重，未覆盖时使用常规字重。 */
export const fontWeight = variable('component-font-weight', { fallback: fontWeights.normal })

/** 组件行高，默认与字号等高。 */
export const lineHeight = variable('component-line-height', { fallback: lineHeights.single })
