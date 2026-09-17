/** CSS calc 乘法保留两个操作数，等待编译。 */
import type { Value, ValueInput } from '../../core/css-value'

/** 创建 calc 乘法 Value，不执行数值运算或推断单位。 */
export function calcMultiply(amount: ValueInput, factor: ValueInput): Value {
  return { kind: 'value', expression: { type: 'product', amount, factor } }
}
