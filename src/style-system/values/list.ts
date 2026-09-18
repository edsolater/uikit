/** CSS 内容列表。 */
import type { CSSFunction, ValueInput } from '../core/css-value'

/** 逗号分隔内容。 */
export function valueList(...items: ValueInput[]): CSSFunction {
  return (read) => items.map(read).filter((item) => item !== undefined).join(', ')
}

/** 空格分隔内容。 */
export function valueSequence(...items: ValueInput[]): CSSFunction {
  return (read) => items.map(read).filter((item) => item !== undefined).join(' ')
}
