/** 在主体结构之上提供颜色与视觉层级效果。 */
import type { Declarations } from '../core/css-rule'
import type { ValueInput } from '../core/css-value'
import { $backgroundColor, $color } from '../properties/color'
import { $boxShadow } from '../properties/box-shadow'

/** 一次颜色配置；foreground 与 background 分别选择内容和承载面的颜色材料。 */
export interface ColorMixinOptions {
  foreground?: ValueInput
  background?: ValueInput
}

/** 按调用方选择的材料建立当前主体的前景与背景颜色，省略的颜色不改变当前层。 */
export const color = (options: ColorMixinOptions = {}): Declarations => [
  [$color, options.foreground],
  [$backgroundColor, options.background],
]

/** 用调用方选择的深度材料表达当前主体的视觉层级；省略材料时不改变当前层。 */
export const elevation = (level?: ValueInput | ValueInput[]): Declarations => [
  [$boxShadow, level],
]
