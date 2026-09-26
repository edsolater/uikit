/** CSS 内容列表。 */
import { createJSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

/** 逗号分隔内容。 */
export function valueList(...items: ValueInput[]): JSSContent {
  return createJSSContent((read) => items.map(read).filter((item) => item !== undefined).join(', '), items)
}

/** 空格分隔内容。 */
export function valueSequence(...items: ValueInput[]): JSSContent {
  return createJSSContent((read) => items.map(read).filter((item) => item !== undefined).join(' '), items)
}
