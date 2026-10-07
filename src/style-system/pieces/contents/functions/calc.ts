/** CSS 数值计算内容。 */
import { createJSSContent, evaluateExpression } from '../../../content'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'
import { readNumber } from '../../../modification'

/** 延迟生成 calc 乘法；单位交给 CSS。 */
export const multiply = (amount: ValueInput, factor: ValueInput): JSSContent => calculate(amount, factor, '*')

/** 延迟生成 calc 加法；单位和求值交给 CSS。 */
export const add = (amount: ValueInput, change: ValueInput): JSSContent => calculate(amount, change, '+')

/** 两条执行路径共享操作数，CSS 保留单位，JS 执行已知数值算术。 */
const calculate = (amount: ValueInput, change: ValueInput, operator: '+' | '*'): JSSContent =>
  Object.assign(createJSSContent((resolve) => {
    const left = resolve(amount)
    const right = resolve(change)
    return left === undefined || right === undefined ? undefined : `calc(${left} ${operator} ${right})`
  }, [amount, change]), {
    [evaluateExpression]: () => operator === '+' ? readNumber(amount) + readNumber(change) : readNumber(amount) * readNumber(change),
  })
