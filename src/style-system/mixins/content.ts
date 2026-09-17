/** 为组件内容建立可参数化复用的排版效果。 */
import type { Declarations } from '../core/css-rule'
import type { ValueInput } from '../core/css-value'
import { $font, $fontSize, $fontWeight, $lineHeight } from '../properties/font'

/** 内容排版共同选择的字体、强调程度和行距。 */
export interface ContentOptions {
  font: ValueInput
  emphasis: ValueInput
  leading: ValueInput
  fontSize: ValueInput
}

/** 用调用方选择的字体、强调程度和行距规定当前主体的内容排版。 */
export const innerText = (options: ContentOptions): Declarations => [
  [$font, options.font],
  [$fontWeight, options.emphasis],
  [$lineHeight, options.leading],
  [$fontSize, options.fontSize],
]
