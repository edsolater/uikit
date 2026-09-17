/** CSS 变换函数保留距离对象，不绑定消费属性。 */
import type { Value, ValueInput } from '../../core/css-value'

/** 创建 translateY 函数 Value；消费属性与子值条件由调用方和编译器决定。 */
export function translateY(distance: ValueInput): Value {
  return { kind: 'value', expression: { type: 'function', name: 'translateY', arguments: [distance] } }
}
