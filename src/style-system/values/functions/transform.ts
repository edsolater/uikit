/** CSS 纵轴平移值。 */
import type { Value, ValueInput } from '../../core/css-value'

/** 构造纵轴平移值，保留距离中的 Condition。 */
export function translateY(distance: ValueInput): Value {
  return { kind: 'value', expression: { type: 'function', name: 'translateY', arguments: [distance] } }
}
