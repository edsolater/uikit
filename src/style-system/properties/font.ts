/** 字体 CSS Key 与复合内容协议。 */
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

/** font 简写 Key；内容可为完整值或 FontParts。 */
export const $font = key('font', 'font')
/** font-size Key。 */
export const $fontSize = key('font-size')
/** font-weight Key。 */
export const $fontWeight = key('font-weight')
/** line-height Key。 */
export const $lineHeight = key('line-height')
