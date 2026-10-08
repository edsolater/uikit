/** CSS 数值计算的内容组织。
 *
 * 组合操作数，提供延迟 CSS 输出与已知 JS 数值计算。
 *
 * 使同一份算术输入可供 CSS 和 JS 修改消费。
 */
import { createJSSContent, evaluateExpression, isEvaluableExpression, type Expression } from '../../../content'
import { assert, isFinite } from '@edsolater/fnkit'
import type { ValueInput } from '../../../value'
import { readJSValue } from '../../../variable'

/**
 * 延迟生成 calc 乘法；单位交给 CSS，JS 求值仅接受有限数值。
 */
export const multiply = (amount: ValueInput, factor: ValueInput): Expression => calculate(amount, factor, '*')

/**
 * 延迟生成 calc 加法；单位交给 CSS，JS 求值仅接受有限数值。
 */
export const add = (amount: ValueInput, change: ValueInput): Expression => calculate(amount, change, '+')

/**
 * 构造共享操作数的 Expression：CSS 输出 calc 文本，evaluateExpression 执行 JS 算术。
 */
const calculate = (amount: ValueInput, change: ValueInput, operator: '+' | '*'): Expression =>
  Object.assign(createJSSContent((resolve) => {
    const left = resolve(amount)
    const right = resolve(change)
    return left === undefined || right === undefined ? undefined : `calc(${left} ${operator} ${right})`
  }, [amount, change]), {
    [evaluateExpression]: () => operator === '+' ? readNumber(amount) + readNumber(change) : readNumber(amount) * readNumber(change),
  })

/**
 * 展开默认来源与 Value，调用内容的 evaluateExpression 或读取原数值；不解析字符串或执行普通生产函数。
 * 不能得到有限数值时抛错。
 */
export function readNumber(input: unknown): number {
  const raw = readJSValue(input)
  const number = isEvaluableExpression(raw)
    ? raw[evaluateExpression]()
    : raw
  assert(isFinite(number), '此表达式没有可直接求值的有限 JS 数值。')
  return number
}
