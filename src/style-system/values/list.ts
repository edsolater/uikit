/** 完整 Value 的逗号列表，不提前展开列表成员。 */
import type { Value, ValueInput } from '../core/css-value'

/** 多个完整 Value 组成的逗号列表，编译时同时传播每个成员的 Condition。 */
export type ValueList = Extract<Value, { kind: 'value' }> & {
  expression: { type: 'list'; items: ValueInput[] }
}

/** 创建按逗号连接的 Value；各成员的 Condition 在编译时共同展开。 */
export function valueList(...items: [ValueInput, ...ValueInput[]]): ValueList {
  return { kind: 'value', expression: { type: 'list', items } }
}
