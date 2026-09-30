/** CSS 乘法内容。 */
import { createJSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

/** 延迟生成 calc 乘法；单位交给 CSS。 */
export function calcMultiply(amount: ValueInput, factor: ValueInput): JSSContent {
  return createJSSContent((resolve) => {
    const left = resolve(amount)
    const right = resolve(factor)
    return left === undefined || right === undefined ? undefined : `calc(${left} * ${right})`
  }, [amount, factor])
}
