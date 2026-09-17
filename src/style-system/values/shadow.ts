/** 阴影复合值。 */
import type { Value, ValueInput } from '../core/css-value'

/** 单层阴影配置。 */
export interface ShadowShape {
  x: ValueInput
  y: ValueInput
  blur?: ValueInput
  spread?: ValueInput
  color?: ValueInput
  inset?: boolean
}

/** 单层阴影 Value。 */
export type Shadow = Extract<Value, { kind: 'value' }> & {
  expression: ShadowShape & { type: 'shadow' }
}

/** 创建单层阴影值。 */
export function shadowValue(shape: ShadowShape): Shadow {
  return { kind: 'value', expression: { type: 'shadow', ...shape } }
}
