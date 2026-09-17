/** 字体字段保留语义关系，字号与行高的组合交给编译器。 */
import { declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import type { ValueInput } from '../core/css-value'

/** CSS font 复合声明的组成字段；字号与字体族必填，其余字段缺省时不输出对应片段。 */
export interface FontParts {
  style?: ValueInput
  weight?: ValueInput
  size: ValueInput
  lineHeight?: ValueInput
  family: ValueInput
}

/** font 简写声明的属性位置。 */
export const fontKey = key('font')
/** font-size 声明的属性位置。 */
export const fontSizeKey = key('font-size')
/** font-weight 声明的属性位置。 */
export const fontWeightKey = key('font-weight')
/** line-height 声明的属性位置。 */
export const lineHeightKey = key('line-height')

/** 创建 font 简写 Declaration；保存完整值或字段，编译时连接字号与可选行高。 */
export function font(input: FontParts | ValueInput) {
  return declaration(fontKey, input, 'font')
}

/** 创建只设置字号的 Declaration，不补充其他字体字段。 */
export const fontSize = (input: ValueInput) => declaration(fontSizeKey, input)

/** 创建只设置字重的 Declaration，不补充其他字体字段。 */
export const fontWeight = (input: ValueInput) => declaration(fontWeightKey, input)

/** 创建只设置行高的 Declaration，不补充其他字体字段。 */
export const lineHeight = (input: ValueInput) => declaration(lineHeightKey, input)
