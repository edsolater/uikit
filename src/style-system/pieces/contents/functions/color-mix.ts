/** 混色的内容组织。
 *
 * 连接颜色与比例，延迟生成 oklab 混色文本。
 *
 * 保留依赖的编译结果，颜色和比例可随外界状态变化。
 */
import { createJSSContent, type Expression } from '../../../content'
import type { ValueInput } from '../../../value'

/** 颜色及可选的零至一比例。 */
export type MixColorInput = ValueInput | [color: ValueInput, weight: ValueInput]

/**
 * 延迟生成 oklab 混色；比例换算为百分比。
 */
export function colorMix(...colors: MixColorInput[]): Expression {
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
