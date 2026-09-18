/** CSS 纵轴平移内容。 */
import type { CSSFunction, ValueInput } from '../../core/css-value'

/** 延迟生成纵轴平移。 */
export function translateY(distance: ValueInput): CSSFunction {
  return (read) => {
    const text = read(distance)
    return text === undefined ? undefined : `translateY(${text})`
  }
}
