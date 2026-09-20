/** CSS 内容列表。 */
import { cssContent } from '../core/css-value'
import type { CSSFunction, ValueInput } from '../core/css-value'

/** 逗号分隔内容。 */
export function valueList(...items: ValueInput[]): CSSFunction {
  return cssContent((read) => items.map(read).filter((item) => item !== undefined).join(', '))
}

/** 空格分隔内容。 */
export function valueSequence(...items: ValueInput[]): CSSFunction {
  return cssContent((read) => items.map(read).filter((item) => item !== undefined).join(' '))
}
