/** CSS 混色内容。 */
import type { CSSFunction, ValueInput } from '../../core/css-value'

/** 颜色及可选的零至一比例。 */
export type MixColorInput = ValueInput | [color: ValueInput, weight: ValueInput]

/** 延迟生成 oklab 混色；比例换算为百分比。 */
export function colorMix(...colors: MixColorInput[]): CSSFunction {
  return (read) => {
    const parts = colors.map((input) => {
      if (!Array.isArray(input)) return read(input)
      const color = read(input[0])
      const weight = read(input[1])
      if (color === undefined || weight === undefined) return undefined
      const percentage = Number.isFinite(Number(weight)) ? `${Number(weight) * 100}%` : `calc(${weight} * 100%)`
      return `${color} ${percentage}`
    })
    return parts.some((part) => part === undefined) ? undefined : `color-mix(in oklab, ${parts.join(', ')})`
  }
}
