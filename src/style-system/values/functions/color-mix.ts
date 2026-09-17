/** 混色的颜色与比例描述。 */
import type { Value, ValueInput } from '../../core/css-value'

/** 混色中的一个颜色，可单独使用或携带零至一的比例。 */
export type MixColorInput = ValueInput | [color: ValueInput, weight: ValueInput]

/** oklab 混色；比例在编译时换算为百分比。 */
export function colorMix(...colors: MixColorInput[]): Value {
  return { kind: 'value', expression: { type: 'color-mix', colors } }
}
