/** 颜色与层级 Mixin。 */
import type { Declarations } from '../../rule'
import type { ValueInput } from '../../value'
import { valueList } from '../contents/atom-creators/list'
import { $backgroundColor, $color } from '../keys/color'
import { $boxShadow } from '../keys/box-shadow'

/** 内容色与背景颜色配置。 */
export interface ColorMixinOptions {
  content?: ValueInput
  background?: ValueInput
}

/** Mixin：主体颜色。 */
export const color = (options: ColorMixinOptions = {}): Declarations => [
  [$color, options.content],
  [$backgroundColor, options.background],
]

/** Mixin：视觉层级。 */
export const elevation = (level?: ValueInput | ValueInput[]): Declarations => [
  [$boxShadow, Array.isArray(level) ? valueList(...level) : level],
]
