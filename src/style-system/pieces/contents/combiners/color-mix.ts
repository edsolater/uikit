/** CSS 混色内容。 */
import { createJSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

/** 颜色及可选的零至一比例。 */
export type MixColorInput = ValueInput | [color: ValueInput, weight: ValueInput]

/** 延迟生成 oklab 混色；比例换算为百分比。 */
export function colorMix(...colors: MixColorInput[]): JSSContent {
  return createJSSContent((resolve) => {
    const parts = colors.map((input) => {
      if (!Array.isArray(input)) return resolve(input)
      const color = resolve(input[0])
      const weight = resolve(input[1])
      if (color === undefined || weight === undefined) return undefined
      const percentage = Number.isFinite(Number(weight)) ? `${Number(weight) * 100}%` : `calc(${weight} * 100%)`
      return `${color} ${percentage}`
    })
    return parts.some((part) => part === undefined) ? undefined : `color-mix(in oklab, ${parts.join(', ')})`
  }, colors.flatMap((input) => Array.isArray(input) ? [input[0], input[1]] : [input]))
}
