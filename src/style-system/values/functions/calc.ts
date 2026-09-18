/** CSS 乘法内容。 */
import type { CSSFunction, ValueInput } from '../../core/css-value'

/** 延迟生成 calc 乘法；单位交给 CSS。 */
export function calcMultiply(amount: ValueInput, factor: ValueInput): CSSFunction {
  return (read) => {
    const left = read(amount)
    const right = read(factor)
    return left === undefined || right === undefined ? undefined : `calc(${left} * ${right})`
  }
}
