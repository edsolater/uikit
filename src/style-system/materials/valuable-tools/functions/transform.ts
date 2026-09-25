/** CSS 纵轴平移内容。 */
import { cssContent } from '../../../value'
import type { CSSFunction, ValueInput } from '../../../value'

/** 延迟生成纵轴平移。 */
export function translateY(distance: ValueInput): CSSFunction {
  return cssContent((read) => {
    const text = read(distance)
    return text === undefined ? undefined : `translateY(${text})`
  }, [distance])
}
