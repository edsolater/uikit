/** 逗号分隔的复合值。 */
import type { Value, ValueInput } from '../core/css-value'

/** 保留成员 Condition 的 Value 列表。 */
export type ValueList = Extract<Value, { kind: 'value' }> & {
  expression: { type: 'list'; items: ValueInput[] }
}

/** 创建逗号分隔值。 */
export function valueList(...items: [ValueInput, ...ValueInput[]]): ValueList {
  return { kind: 'value', expression: { type: 'list', items } }
}
