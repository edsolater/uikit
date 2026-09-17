/** 混色材料只描述颜色及比例，编译时传播子值条件。 */
import type { Value, ValueInput } from '../../core/css-value'

/** 混色中的一个颜色，可单独使用或携带零至一的比例。 */
export type MixColorInput = ValueInput | [color: ValueInput, weight: number]

/** 创建 oklab 混色 Value；元组第二项是比例，编译时乘以 100 输出百分比，不自动归一化。 */
export function colorMix(...colors: MixColorInput[]): Value {
  return { kind: 'value', expression: { type: 'color-mix', colors } }
}
