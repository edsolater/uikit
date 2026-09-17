/** 常用属性的声明组合，交给 rules 批量登记。 */
import type { Declarations } from '../core/css-rule'
import { $display, $alignItems, $alignSelf, $justifyContent } from '../properties/layout'

/** 行内弹性容器，内容双向居中；自身作为布局子项时也居中对齐。 */
export const inlineCenter = (): Declarations => [
  [$display, 'inline-flex'],
  [$alignItems, 'center'],
  [$alignSelf, 'center'],
  [$justifyContent, 'center'],
]
