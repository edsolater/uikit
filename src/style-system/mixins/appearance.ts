/** 颜色与层级 Mixin。 */
import type { Declarations } from '../core/css-rule'
import type { ValueInput } from '../core/css-value'
import { valueList } from '../values/list'
import { $backgroundColor, $color } from '../properties/color'
import { $boxShadow } from '../properties/box-shadow'

/** 前景与背景颜色配置。 */
export interface ColorMixinOptions {
  foreground?: ValueInput
  background?: ValueInput
}

/** Mixin：主体颜色。 */
export const color = (options: ColorMixinOptions = {}): Declarations => [
  [$color, options.foreground],
  [$backgroundColor, options.background],
]

/** Mixin：视觉层级。 */
export const elevation = (level?: ValueInput | ValueInput[]): Declarations => [
  [$boxShadow, Array.isArray(level) ? valueList(...level) : level],
]
