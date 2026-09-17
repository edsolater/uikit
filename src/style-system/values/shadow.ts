/** 一条阴影的几何与颜色，保留所有子 Value。 */
import type { Value, ValueInput } from '../core/css-value'

/** 一层 CSS 阴影的几何、颜色与内阴影标记；每个取值都可继续携带 Condition。 */
export interface ShadowShape {
  x: ValueInput
  y: ValueInput
  blur?: ValueInput
  spread?: ValueInput
  color?: ValueInput
  inset?: boolean
}

/** 可放入 boxShadow Declaration 内容数组的完整阴影 Value。 */
export type Shadow = Extract<Value, { kind: 'value' }> & {
  expression: ShadowShape & { type: 'shadow' }
}

/** 创建一条阴影 Value；编译时若只给 spread，会补上 blur 的 0 占位，不提前读取子值。 */
export function shadowValue(shape: ShadowShape): Shadow {
  return { kind: 'value', expression: { type: 'shadow', ...shape } }
}
