/** CSS 数值计算内容。 */
import { createJSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

/** 延迟生成 calc 乘法；单位交给 CSS。 */
export function multiply(amount: ValueInput, factor: ValueInput): JSSContent {
  return createJSSContent((resolve) => {
    const left = resolve(amount)
    const right = resolve(factor)
    return left === undefined || right === undefined ? undefined : `calc(${left} * ${right})`
  }, [amount, factor])
}

/** 延迟生成 calc 加法；单位和求值交给 CSS。 */
export function add(amount: ValueInput, change: ValueInput): JSSContent {
  return createJSSContent((resolve) => {
    const left = resolve(amount)
    const right = resolve(change)
    return left === undefined || right === undefined ? undefined : `calc(${left} + ${right})`
  }, [amount, change])
}
