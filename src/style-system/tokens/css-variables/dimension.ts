/** 可局部覆盖的间距、尺寸和边界厚度。 */
import { lengths, space as spacing } from '../values/dimension'
import { token } from '../token'

/** 可覆盖的间距阶梯；内外边距与内容间隔共享同一套尺度。 */
export const space = {
  small: token('space-2', spacing.small),
  normal: token('space-3', spacing.normal),
  medium: token('space-4', spacing.medium),
  large: token('space-5', spacing.large),
  xlarge: token('space-6', spacing.xlarge),
  wide: token('space-7', spacing.wide),
  widest: token('space-8', spacing.widest),
}

/** 控件尺寸阶梯，与内容间距独立调整。 */
export const size = {
  small: token('size-3', lengths.px32),
  normal: token('size-5', lengths.px48),
  large: token('size-7', lengths.px64),
  xlarge: token('size-8', lengths.px80),
}

/** 边缘厚度：细线与焦点提示使用不同档位。 */
export const boundary = {
  thin: token('boundary-1', lengths.px1),
  focus: token('boundary-2', lengths.px2),
}
