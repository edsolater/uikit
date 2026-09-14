/** 空间尺度与独立的圆角尺度。 */
import { value } from '../../core/css-value'

/** 固定像素长度，按数值共享，不绑定具体属性。 */
export const lengths = {
  px1: value('1px'),
  px2: value('2px'),
  px4: value('4px'),
  px8: value('8px'),
  px12: value('12px'),
  px16: value('16px'),
  px24: value('24px'),
  px32: value('32px'),
  px48: value('48px'),
  px64: value('64px'),
  px80: value('80px'),
}

/** 圆角尺度：小圆角与胶囊圆角，不与一般间距混为一套语义。 */
export const radii = { small: value('4px'), pill: value('999px') }

/** 间距尺度不绑定属性，同一档可用于内边距、外边距或元素间隔。 */
export const space = {
  small: lengths.px4,
  normal: lengths.px8,
  medium: lengths.px12,
  large: lengths.px16,
  xlarge: lengths.px24,
  wide: lengths.px32,
  widest: lengths.px48,
}
